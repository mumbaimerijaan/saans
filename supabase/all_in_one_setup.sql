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
-- Row Level Security (RLS) Policies for SAANS Platform

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Public can read basic profile info, user can update own
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Household profiles: User can view and edit own household
CREATE POLICY "Users view own household" 
ON household_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users manage own household" 
ON household_profiles FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Assistance Requests: Citizens view own, volunteers view approved/assigned, admins view all
CREATE POLICY "View assistance requests" 
ON assistance_requests FOR SELECT TO authenticated 
USING (
    auth.uid() = user_id 
    OR is_admin()
    OR (status IN ('approved', 'assigned', 'in_progress'))
);

CREATE POLICY "Users create assistance requests" 
ON assistance_requests FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own request before assignment" 
ON assistance_requests FOR UPDATE TO authenticated 
USING (auth.uid() = user_id OR is_admin());

-- Equipment: Public can view available/verified equipment, donors update own
CREATE POLICY "View equipment" 
ON equipment FOR SELECT TO authenticated 
USING (status != 'maintenance' OR donor_id = auth.uid() OR is_admin());

CREATE POLICY "Donors manage own equipment" 
ON equipment FOR ALL TO authenticated 
USING (donor_id = auth.uid() OR is_admin());

-- Facilities: View verified facilities publicly
CREATE POLICY "View verified facilities" 
ON facilities FOR SELECT USING (is_verified = true OR is_admin());

CREATE POLICY "Admins manage facilities" 
ON facilities FOR ALL TO authenticated USING (is_admin());

-- Notifications: Strictly user's own
CREATE POLICY "Users manage own notifications" 
ON notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- Conversations & Messages: Strictly user's own
CREATE POLICY "Users manage own conversations" 
ON conversations FOR ALL TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own messages" 
ON conversation_messages FOR ALL TO authenticated 
USING (EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = conversation_messages.conversation_id 
    AND conversations.user_id = auth.uid()
));

-- Audit Logs: Admin only
CREATE POLICY "Admins view audit logs" 
ON audit_logs FOR SELECT TO authenticated USING (is_admin());
-- SAANS Platform Seed Data for Mumbai, Maharashtra

-- Reference Profiles (UUIDs are deterministic for tests)
-- Admin: admin@saans.org
-- Citizen: priya.sharma@example.com
-- Volunteer: rahul.deshmukh@example.com
-- Donor: cleanair.mumbai@example.com

INSERT INTO profiles (id, email, full_name, phone, city, neighbourhood, preferred_language, account_type, latitude, longitude)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@saans.org', 'Admin SAANS', '+91 98200 11223', 'Mumbai', 'Bandra West', 'en', 'admin', 19.0596, 72.8295),
('c0000000-0000-0000-0000-000000000002', 'priya.sharma@example.com', 'Priya Sharma', '+91 98333 44556', 'Mumbai', 'Kurla West', 'hi', 'citizen', 19.0657, 72.8794),
('b0000003-0000-0000-0000-000000000003', 'rahul.deshmukh@example.com', 'Rahul Deshmukh', '+91 99201 55667', 'Mumbai', 'Dadar', 'mr', 'volunteer', 19.0178, 72.8478),
('d0000000-0000-0000-0000-000000000004', 'cleanair.mumbai@example.com', 'CleanAir NGO Mumbai', '+91 98199 77889', 'Mumbai', 'Andheri East', 'en', 'donor', 19.1136, 72.8697)
ON CONFLICT (id) DO NOTHING;

-- User Roles
INSERT INTO user_roles (user_id, role)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin'),
('c0000000-0000-0000-0000-000000000002', 'citizen'),
('b0000003-0000-0000-0000-000000000003', 'volunteer'),
('d0000000-0000-0000-0000-000000000004', 'donor')
ON CONFLICT DO NOTHING;

-- Household Profile for Priya
INSERT INTO household_profiles (user_id, member_count, elderly_present, children_present, sensitive_persons, housing_type, room_size_sqft, existing_purifiers)
VALUES
('c0000000-0000-0000-0000-000000000002', 4, true, true, true, '2BHK Apartment near Western Express Highway', 280, 'None')
ON CONFLICT DO NOTHING;

-- Volunteer Profile for Rahul
INSERT INTO volunteer_profiles (id, user_id, service_radius_km, experience_years, bio, languages, organisation_affiliation, is_verified, status)
VALUES
('b0000000-0000-0000-0000-000000000001', 'b0000003-0000-0000-0000-000000000003', 15, 3, 'Electrical technician and clean air activist in Mumbai. Specializing in Corsi-Rosenthal boxes and filter installations.', ARRAY['en', 'hi', 'mr'], 'Mumbai Breathing Initiative', true, 'active')
ON CONFLICT DO NOTHING;

-- Volunteer Skills for Rahul
INSERT INTO volunteer_skills (volunteer_id, skill_category, proficiency_level)
VALUES
('b0000000-0000-0000-0000-000000000001', 'installation', 'expert'),
('b0000000-0000-0000-0000-000000000001', 'electrical', 'expert'),
('b0000000-0000-0000-0000-000000000001', 'repair', 'intermediate')
ON CONFLICT DO NOTHING;

-- Real Clean Air Facilities in Mumbai
INSERT INTO facilities (id, name, facility_type, address, city, neighbourhood, latitude, longitude, contact_phone, contact_email, operating_hours, filtration_equipment_details, capacity, is_verified)
VALUES
('f0000000-0000-0000-0000-000000000001', 'Bandra Public Library Clean Air Zone', 'library', 'Near Hill Road, Bandra West', 'Mumbai', 'Bandra West', 19.0558, 72.8300, '+91 22 2640 1234', 'bandra.library@mumbai.gov.in', '08:00 AM - 08:00 PM', 'Triple HEPA H13 Air Purifiers + Positive Pressure Airflow System', 45, true),
('f0000000-0000-0000-0000-000000000002', 'Dadar Community Wellness Centre', 'community_hall', 'Gokhale Road North, Dadar', 'Mumbai', 'Dadar', 19.0195, 72.8428, '+91 22 2430 5678', 'dadar.wellness@saans.community', '07:00 AM - 09:00 PM', 'Dual Industrial CADR 650 m3/h Filtration Units with Carbon Bed', 60, true),
('f0000000-0000-0000-0000-000000000003', 'Chembur Senior Citizens Respite Shelter', 'clinic', 'Near Chembur Naka, Chembur', 'Mumbai', 'Chembur', 19.0622, 72.8992, '+91 22 2522 9988', 'chembur.respite@saans.community', '09:00 AM - 06:00 PM', 'Medical Grade HEPA + Activated Carbon, Low Noise Operation', 30, true),
('f0000000-0000-0000-0000-000000000004', 'Andheri East NGO Learning Centre', 'school', 'Chakala, Andheri East', 'Mumbai', 'Andheri East', 19.1158, 72.8654, '+91 22 2822 4411', 'learning@cleanairandheri.org', '08:30 AM - 05:30 PM', '4x Corsi-Rosenthal DIY Box Purifiers with MERV-13 Filters', 40, true)
ON CONFLICT DO NOTHING;

-- Clean Air Equipment Library
INSERT INTO equipment (id, donor_id, name, category, description, manufacturer_model, condition, type, max_loan_duration_days, location_city, location_neighbourhood, latitude, longitude, status, is_verified, cadr_rating)
VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Philips Series 2000i HEPA Purifier', 'hepa_purifier', 'High CADR purifier suitable for master bedroom or living room up to 350 sq ft. Real-time PM2.5 feedback display.', 'Philips AC2887/20', 'like_new', 'loan', 30, 'Mumbai', 'Andheri East', 19.1136, 72.8697, 'available', true, 333),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'Corsi-Rosenthal DIY Box System (MERV 13)', 'diy_filtration', 'Community assembled 4-filter high-flow cube with Orient box fan. Ultra-low resistance, high particulate throughput.', 'SAANS-CR-4x', 'new', 'donation', 0, 'Mumbai', 'Dadar', 19.0178, 72.8478, 'available', true, 420),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 'Laser Particle Sensor IAQ Monitor', 'iaq_monitor', 'Accurate laser scattering particulate sensor measuring PM1.0, PM2.5 and PM10 with OLED read-out.', 'Temtop LKC-1000S+', 'good', 'loan', 14, 'Mumbai', 'Bandra West', 19.0596, 72.8295, 'available', true, NULL),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'N95 / FFP2 Respirator Family Pack (50 Pcs)', 'protective_gear', 'Certified ISI-approved particulate respirator masks with comfortable headband for outdoor commuting.', 'Venus V-4400', 'new', 'donation', 0, 'Mumbai', 'Kurla West', 19.0657, 72.8794, 'available', true, NULL)
ON CONFLICT DO NOTHING;

-- Initial Assistance Request for Priya Sharma
INSERT INTO assistance_requests (id, user_id, category, description, location_city, location_neighbourhood, latitude, longitude, urgency, household_type, existing_equipment, contact_method, consent_shared, status)
VALUES
('a1111111-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'purifier_loan', 'Elderly parent has severe asthma exacerbation during winter smog inversion. Living room facing heavy traffic corridor.', 'Mumbai', 'Kurla West', 19.0657, 72.8794, 'high', 'Family with elderly & child', 'Only ceiling fans', 'Phone call or In-app', true, 'approved')
ON CONFLICT DO NOTHING;

-- Community Pollution Reports
INSERT INTO community_reports (id, reporter_id, category, description, city, neighbourhood, latitude, longitude, status, resolution_notes)
VALUES
('a2222222-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'garbage_burning', 'Uncontrolled waste burning near railway tracks creating thick acrid smoke settling into residential colony.', 'Mumbai', 'Kurla West', 19.0680, 72.8810, 'verified', 'Reported to Ward L municipal sanitary officer and local resident association notified.'),
('a2222222-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'construction_dust', 'Uncovered metro station construction piling without dust suppression sprinklers or green netting barriers.', 'Mumbai', 'Andheri East', 19.1120, 72.8680, 'under_review', NULL)
ON CONFLICT DO NOTHING;

-- Community Initiatives
INSERT INTO community_initiatives (id, title, description, city, neighbourhood, organiser_id, start_date, end_date, target_participants, current_participants, status)
VALUES
('a4444444-0000-0000-0000-000000000001', 'Mumbai Winter Smog DIY Purifier Workshop', 'Hands-on community workshop where 25 families build and take home affordable Corsi-Rosenthal box purifiers.', 'Mumbai', 'Dadar', 'a0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 4 hours', 50, 34, 'active'),
('a4444444-0000-0000-0000-000000000002', 'Bandra High-Traffic School Clean Air Corridor', 'Installation of indoor air purifiers and planting micro-green air screens in 3 community primary schools.', 'Mumbai', 'Bandra West', 'd0000000-0000-0000-0000-000000000004', NOW() + INTERVAL '10 days', NOW() + INTERVAL '12 days', 80, 62, 'upcoming')
ON CONFLICT DO NOTHING;

-- Initial Verified Impact Records
INSERT INTO impact_records (metric_type, value, recorded_at, methodology_notes)
VALUES
('equipment_donated', 18, NOW() - INTERVAL '5 days', 'Verified records of donor equipment delivered to citizens in need.'),
('equipment_loaned', 34, NOW() - INTERVAL '4 days', 'Active and completed air purifier loans with signed handovers.'),
('diy_assembled', 52, NOW() - INTERVAL '3 days', 'Completed DIY Corsi-Rosenthal purifiers recorded via community workshops.'),
('requests_fulfilled', 47, NOW() - INTERVAL '2 days', 'Citizen assistance requests successfully marked completed with verification notes.'),
('volunteer_tasks_completed', 68, NOW() - INTERVAL '1 day', 'Field tasks completed by verified SAANS volunteers across Mumbai.'),
('facilities_onboarded', 4, NOW(), 'Verified clean air sanctuaries audited and approved in platform registry.')
ON CONFLICT DO NOTHING;
