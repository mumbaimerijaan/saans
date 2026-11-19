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
('v0000000-0000-0000-0000-000000000003', 'rahul.deshmukh@example.com', 'Rahul Deshmukh', '+91 99201 55667', 'Mumbai', 'Dadar', 'mr', 'volunteer', 19.0178, 72.8478),
('d0000000-0000-0000-0000-000000000004', 'cleanair.mumbai@example.com', 'CleanAir NGO Mumbai', '+91 98199 77889', 'Mumbai', 'Andheri East', 'en', 'donor', 19.1136, 72.8697)
ON CONFLICT (id) DO NOTHING;

-- User Roles
INSERT INTO user_roles (user_id, role)
VALUES
('a0000000-0000-0000-0000-000000000001', 'admin'),
('c0000000-0000-0000-0000-000000000002', 'citizen'),
('v0000000-0000-0000-0000-000000000003', 'volunteer'),
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
('b0000000-0000-0000-0000-000000000001', 'v0000000-0000-0000-0000-000000000003', 15, 3, 'Electrical technician and clean air activist in Mumbai. Specializing in Corsi-Rosenthal boxes and filter installations.', ARRAY['en', 'hi', 'mr'], 'Mumbai Breathing Initiative', true, 'active')
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
('r0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'purifier_loan', 'Elderly parent has severe asthma exacerbation during winter smog inversion. Living room facing heavy traffic corridor.', 'Mumbai', 'Kurla West', 19.0657, 72.8794, 'high', 'Family with elderly & child', 'Only ceiling fans', 'Phone call or In-app', true, 'approved')
ON CONFLICT DO NOTHING;

-- Community Pollution Reports
INSERT INTO community_reports (id, reporter_id, category, description, city, neighbourhood, latitude, longitude, status, resolution_notes)
VALUES
('p0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'garbage_burning', 'Uncontrolled waste burning near railway tracks creating thick acrid smoke settling into residential colony.', 'Mumbai', 'Kurla West', 19.0680, 72.8810, 'verified', 'Reported to Ward L municipal sanitary officer and local resident association notified.'),
('p0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'construction_dust', 'Uncovered metro station construction piling without dust suppression sprinklers or green netting barriers.', 'Mumbai', 'Andheri East', 19.1120, 72.8680, 'under_review', NULL)
ON CONFLICT DO NOTHING;

-- Community Initiatives
INSERT INTO community_initiatives (id, title, description, city, neighbourhood, organiser_id, start_date, end_date, target_participants, current_participants, status)
VALUES
('i0000000-0000-0000-0000-000000000001', 'Mumbai Winter Smog DIY Purifier Workshop', 'Hands-on community workshop where 25 families build and take home affordable Corsi-Rosenthal box purifiers.', 'Mumbai', 'Dadar', 'a0000000-0000-0000-0000-000000000001', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 4 hours', 50, 34, 'active'),
('i0000000-0000-0000-0000-000000000002', 'Bandra High-Traffic School Clean Air Corridor', 'Installation of indoor air purifiers and planting micro-green air screens in 3 community primary schools.', 'Mumbai', 'Bandra West', 'd0000000-0000-0000-0000-000000000004', NOW() + INTERVAL '10 days', NOW() + INTERVAL '12 days', 80, 62, 'upcoming')
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
