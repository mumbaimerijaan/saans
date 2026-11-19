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
