-- SAANS Platform Database Schema Migration
-- 23 Relational Tables with RLS, Constraints, and Indexes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    city TEXT NOT NULL DEFAULT 'Mumbai',
    neighbourhood TEXT NOT NULL DEFAULT 'Bandra West',
    preferred_language TEXT NOT NULL DEFAULT 'en',
    account_type TEXT NOT NULL CHECK (account_type IN ('citizen', 'volunteer', 'donor', 'admin')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'volunteer', 'donor', 'admin')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 3. Household Profiles
CREATE TABLE IF NOT EXISTS household_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_count INT NOT NULL DEFAULT 3,
    elderly_present BOOLEAN NOT NULL DEFAULT FALSE,
    children_present BOOLEAN NOT NULL DEFAULT FALSE,
    sensitive_persons BOOLEAN NOT NULL DEFAULT FALSE,
    housing_type TEXT DEFAULT 'Apartment',
    room_size_sqft INT DEFAULT 200,
    existing_purifiers TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Volunteer Profiles
CREATE TABLE IF NOT EXISTS volunteer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_radius_km INT NOT NULL DEFAULT 10,
    experience_years INT DEFAULT 1,
    bio TEXT,
    languages TEXT[] DEFAULT ARRAY['en', 'hi', 'mr'],
    organisation_affiliation TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'busy', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Volunteer Skills
CREATE TABLE IF NOT EXISTS volunteer_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
    skill_category TEXT NOT NULL CHECK (skill_category IN ('electrical', 'installation', 'repair', 'awareness', 'logistics', 'health_edu', 'general')),
    proficiency_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Organisations
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    city TEXT NOT NULL DEFAULT 'Mumbai',
    address TEXT NOT NULL,
    registration_number TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Assistance Requests
CREATE TABLE IF NOT EXISTS assistance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN (
        'purifier_loan', 'purifier_donation', 'diy_installation',
        'filter_replacement', 'equipment_repair', 'protective_gear',
        'iaq_assessment', 'facility_access', 'other'
    )),
    description TEXT NOT NULL,
    location_city TEXT NOT NULL DEFAULT 'Mumbai',
    location_neighbourhood TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    household_type TEXT DEFAULT 'Family with children',
    existing_equipment TEXT,
    contact_method TEXT NOT NULL DEFAULT 'In-app message',
    consent_shared BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'under_review', 'approved', 'assigned',
        'in_progress', 'completed', 'rejected', 'cancelled', 'on_hold'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Request Assignments
CREATE TABLE IF NOT EXISTS request_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES assistance_requests(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'rejected', 'completed')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completion_notes TEXT,
    completion_photo_url TEXT
);

-- 9. Equipment
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'hepa_purifier', 'diy_filtration', 'replacement_filter',
        'fan_component', 'iaq_monitor', 'protective_gear'
    )),
    description TEXT NOT NULL,
    manufacturer_model TEXT,
    condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
    type TEXT NOT NULL DEFAULT 'loan' CHECK (type IN ('donation', 'loan')),
    max_loan_duration_days INT DEFAULT 30,
    location_city TEXT NOT NULL DEFAULT 'Mumbai',
    location_neighbourhood TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
        'available', 'requested', 'reserved', 'issued', 'returned', 'maintenance'
    )),
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    cadr_rating INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Equipment Requests
CREATE TABLE IF NOT EXISTS equipment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'fulfilled')),
    requested_duration_days INT DEFAULT 14,
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Equipment Transactions
CREATE TABLE IF NOT EXISTS equipment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES profiles(id),
    to_user_id UUID REFERENCES profiles(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('loan', 'donation_transfer', 'return')),
    issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_return_date TIMESTAMPTZ,
    actual_return_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Equipment Maintenance
CREATE TABLE IF NOT EXISTS equipment_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    performed_by UUID REFERENCES profiles(id),
    maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('filter_change', 'motor_repair', 'cleaning', 'safety_inspection')),
    notes TEXT,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_due_at TIMESTAMPTZ
);

-- 13. Facilities
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    facility_type TEXT NOT NULL CHECK (facility_type IN ('library', 'community_hall', 'school', 'clinic', 'housing_society', 'ngo_centre')),
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Mumbai',
    neighbourhood TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    operating_hours TEXT NOT NULL DEFAULT '09:00 AM - 07:00 PM',
    accessibility_features TEXT[] DEFAULT ARRAY['wheelchair_accessible', 'drinking_water', 'restrooms'],
    filtration_equipment_details TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 50,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Facility Verifications
CREATE TABLE IF NOT EXISTS facility_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES profiles(id),
    verification_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'pending')),
    inspection_notes TEXT
);

-- 15. Community Reports
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('garbage_burning', 'construction_dust', 'industrial_smoke', 'roadside_burning', 'excessive_dust', 'other')),
    description TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Mumbai',
    neighbourhood TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'verified', 'rejected', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Community Initiatives
CREATE TABLE IF NOT EXISTS community_initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Mumbai',
    neighbourhood TEXT NOT NULL,
    organiser_id UUID NOT NULL REFERENCES profiles(id),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    target_participants INT DEFAULT 100,
    current_participants INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Donations
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('funds', 'filters', 'masks', 'purifiers', 'accessories')),
    quantity INT NOT NULL DEFAULT 1,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged', 'received', 'allocated')),
    allocated_to_request_id UUID REFERENCES assistance_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    event_type TEXT NOT NULL,
    related_entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Clean Air Consultation',
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi', 'mr')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Conversation Messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    structured_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Air Quality Cache
CREATE TABLE IF NOT EXISTS air_quality_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city TEXT NOT NULL,
    neighbourhood TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    data_source TEXT NOT NULL,
    aqi_index INT,
    aqi_category TEXT,
    pollutants JSONB NOT NULL,
    forecast JSONB,
    raw_response JSONB,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 22. Impact Records
CREATE TABLE IF NOT EXISTS impact_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'equipment_donated', 'equipment_loaned', 'equipment_repaired',
        'diy_assembled', 'requests_fulfilled', 'volunteer_tasks_completed',
        'facilities_onboarded', 'reports_resolved', 'people_reached'
    )),
    value INT NOT NULL DEFAULT 1,
    related_entity_type TEXT,
    related_entity_id UUID,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    methodology_notes TEXT NOT NULL DEFAULT 'Aggregated directly from verified operational database activity.'
);

-- 23. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_requests_status ON assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_user ON assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_facilities_verified ON facilities(is_verified);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_aq_cache_coords ON air_quality_cache(latitude, longitude, expires_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON community_reports(status);

-- Enable Row Level Security (RLS) across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_quality_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
