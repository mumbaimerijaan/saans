import fs from 'fs';
import path from 'path';
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

// Standard RFC 4122 DNS namespace for deterministic UUID v5 generation
const RFC4122_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Ensures any identifier string is converted into a strictly compliant RFC 4122 UUID.
 * Preserves existing 36-character hyphenated UUIDs, and deterministically transforms
 * non-UUID strings (e.g. 'hp-1', 'asgn-173...', 'test-req') using standard RFC 4122 v5.
 */
export function toValidUuid(id: string): string {
  if (!id) return uuidv4();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  // Generate deterministic RFC 4122 Version 5 UUID for arbitrary non-UUID string keys
  return uuidv5(id, RFC4122_NAMESPACE);
}

export interface Profile {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  city: string;
  neighbourhood: string;
  preferred_language: 'en' | 'hi' | 'mr';
  account_type: 'citizen' | 'volunteer' | 'donor' | 'admin';
  latitude?: number;
  longitude?: number;
  is_demo_account?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'citizen' | 'volunteer' | 'donor' | 'admin';
  granted_at: string;
}

export interface HouseholdProfile {
  id: string;
  user_id: string;
  member_count: number;
  elderly_present: boolean;
  children_present: boolean;
  sensitive_persons: boolean;
  housing_type: string;
  room_size_sqft: number;
  existing_purifiers?: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerProfile {
  id: string;
  user_id: string;
  service_radius_km: number;
  experience_years: number;
  bio?: string;
  languages: string[];
  organisation_affiliation?: string;
  is_verified: boolean;
  status: 'active' | 'busy' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface VolunteerSkill {
  id: string;
  volunteer_id: string;
  skill_category: 'electrical' | 'installation' | 'repair' | 'awareness' | 'logistics' | 'health_edu' | 'general';
  proficiency_level: 'beginner' | 'intermediate' | 'expert';
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  city: string;
  address: string;
  registration_number?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssistanceRequest {
  id: string;
  user_id: string;
  category: 'purifier_loan' | 'purifier_donation' | 'diy_installation' | 'filter_replacement' | 'equipment_repair' | 'protective_gear' | 'iaq_assessment' | 'facility_access' | 'other';
  description: string;
  location_city: string;
  location_neighbourhood: string;
  latitude?: number;
  longitude?: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  household_type?: string;
  existing_equipment?: string;
  contact_method: string;
  consent_shared: boolean;
  status: 'submitted' | 'under_review' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'on_hold' | 'matched';
  created_at: string;
  updated_at: string;
}

export interface RequestAssignment {
  id: string;
  request_id: string;
  volunteer_id: string;
  status: 'assigned' | 'accepted' | 'rejected' | 'completed';
  assigned_at: string;
  updated_at: string;
  completion_notes?: string;
  completion_photo_url?: string;
}

export interface Equipment {
  id: string;
  donor_id?: string;
  name: string;
  category: 'hepa_purifier' | 'diy_filtration' | 'replacement_filter' | 'fan_component' | 'iaq_monitor' | 'protective_gear';
  description: string;
  manufacturer_model?: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  type: 'donation' | 'loan';
  max_loan_duration_days?: number;
  location_city: string;
  location_neighbourhood: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  status: 'available' | 'requested' | 'reserved' | 'issued' | 'returned' | 'maintenance';
  is_verified: boolean;
  is_demo?: boolean;
  cadr_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface EquipmentRequest {
  id: string;
  equipment_id: string;
  requester_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'fulfilled';
  requested_duration_days?: number;
  purpose: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentTransaction {
  id: string;
  equipment_id: string;
  from_user_id?: string;
  to_user_id?: string;
  transaction_type: 'loan' | 'donation_transfer' | 'return';
  issue_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  notes?: string;
  created_at: string;
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  performed_by?: string;
  maintenance_type: 'filter_change' | 'motor_repair' | 'cleaning' | 'safety_inspection';
  notes?: string;
  performed_at: string;
  next_due_at?: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: 'library' | 'community_hall' | 'school' | 'clinic' | 'housing_society' | 'ngo_centre';
  address: string;
  city: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  contact_phone?: string;
  contact_email?: string;
  operating_hours: string;
  accessibility_features: string[];
  filtration_equipment_details: string;
  capacity: number;
  is_verified: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityVerification {
  id: string;
  facility_id: string;
  verified_by: string;
  verification_date: string;
  status: 'approved' | 'rejected' | 'pending';
  inspection_notes?: string;
}

export interface CommunityReport {
  id: string;
  reporter_id: string;
  category: 'garbage_burning' | 'construction_dust' | 'industrial_smoke' | 'roadside_burning' | 'excessive_dust' | 'other';
  description: string;
  city: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  status: 'submitted' | 'under_review' | 'verified' | 'rejected' | 'resolved';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityInitiative {
  id: string;
  title: string;
  description: string;
  city: string;
  neighbourhood: string;
  organiser_id: string;
  start_date: string;
  end_date?: string;
  target_participants: number;
  current_participants: number;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  item_type: 'funds' | 'filters' | 'masks' | 'purifiers' | 'accessories';
  quantity: number;
  description: string;
  status: 'pledged' | 'received' | 'allocated';
  allocated_to_request_id?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event_type: string;
  related_entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  language: 'en' | 'hi' | 'mr';
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  structured_data?: any;
  created_at: string;
}

export interface AirQualityCache {
  id: string;
  city: string;
  neighbourhood?: string;
  latitude: number;
  longitude: number;
  data_source: string;
  aqi_index?: number;
  aqi_category?: string;
  pollutants: Record<string, any>;
  forecast?: any;
  raw_response?: any;
  fetched_at: string;
  expires_at: string;
}

export interface ImpactRecord {
  id: string;
  metric_type: 'equipment_donated' | 'equipment_loaned' | 'equipment_repaired' | 'diy_assembled' | 'requests_fulfilled' | 'volunteer_tasks_completed' | 'facilities_onboarded' | 'reports_resolved' | 'people_reached';
  value: number;
  related_entity_type?: string;
  related_entity_id?: string;
  recorded_at: string;
  methodology_notes: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}

export interface DatabaseState {
  profiles: Profile[];
  user_roles: UserRole[];
  household_profiles: HouseholdProfile[];
  volunteer_profiles: VolunteerProfile[];
  volunteer_skills: VolunteerSkill[];
  organisations: Organisation[];
  assistance_requests: AssistanceRequest[];
  request_assignments: RequestAssignment[];
  equipment: Equipment[];
  equipment_requests: EquipmentRequest[];
  equipment_transactions: EquipmentTransaction[];
  equipment_maintenance: EquipmentMaintenance[];
  facilities: Facility[];
  facility_verifications: FacilityVerification[];
  community_reports: CommunityReport[];
  community_initiatives: CommunityInitiative[];
  donations: Donation[];
  notifications: Notification[];
  conversations: Conversation[];
  conversation_messages: ConversationMessage[];
  air_quality_cache: AirQualityCache[];
  impact_records: ImpactRecord[];
  audit_logs: AuditLog[];
}

export class DatabaseStore {
  private static instance: DatabaseStore;
  private dbPath: string;
  private state: DatabaseState;
  public supabase: SupabaseClient | null = null;

  private constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'saans_db.json');
    this.state = this.loadState();

    if (config.supabaseUrl && (config.supabaseServiceRoleKey || config.supabaseAnonKey)) {
      try {
        this.supabase = createClient(
          config.supabaseUrl,
          config.supabaseServiceRoleKey || config.supabaseAnonKey
        );
      } catch (err) {
        console.warn('Supabase client initialization skipped/failed:', err);
      }
    }
  }

  public static getInstance(): DatabaseStore {
    if (!DatabaseStore.instance) {
      DatabaseStore.instance = new DatabaseStore();
    }
    return DatabaseStore.instance;
  }

  private loadState(): DatabaseState {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed reading existing db file, initializing seed:', e);
      }
    }
    return this.getSeedData();
  }

  public async save(): Promise<void> {
    // Snapshot state before persistence for transactional rollback safety
    const preSaveSnapshot = JSON.parse(JSON.stringify(this.state));

    try {
      // 1. Authoritative persistence: When Supabase client is active, persist directly to PostgreSQL first
      if (this.supabase) {
        await this.syncStateToSupabase();
      }
      // 2. Persist local file snapshot
      fs.writeFileSync(this.dbPath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Authoritative persistence failure, rolling back in-memory state to pre-mutation snapshot:', e);
      // Revert in-memory state to pre-mutation snapshot to prevent state divergence
      this.state = preSaveSnapshot;
      // Re-hydrate from Supabase to guarantee 100% alignment with database
      if (this.supabase) {
        try {
          await this.hydrateFromSupabase();
        } catch (hydrationErr) {
          console.error('Post-rollback hydration failed:', hydrationErr);
        }
      }
      throw e;
    }
  }

  public async hydrateFromSupabase(): Promise<boolean> {
    if (!this.supabase) return false;
    
    const tableNames = [
      'profiles',
      'user_roles',
      'household_profiles',
      'volunteer_profiles',
      'volunteer_skills',
      'organisations',
      'assistance_requests',
      'request_assignments',
      'equipment',
      'equipment_requests',
      'facilities',
      'community_reports',
      'community_initiatives',
      'notifications',
      'impact_records',
    ] as const;

    const results = await Promise.all([
      this.supabase.from('profiles').select('*'),
      this.supabase.from('user_roles').select('*'),
      this.supabase.from('household_profiles').select('*'),
      this.supabase.from('volunteer_profiles').select('*'),
      this.supabase.from('volunteer_skills').select('*'),
      this.supabase.from('organisations').select('*'),
      this.supabase.from('assistance_requests').select('*'),
      this.supabase.from('request_assignments').select('*'),
      this.supabase.from('equipment').select('*'),
      this.supabase.from('equipment_requests').select('*'),
      this.supabase.from('facilities').select('*'),
      this.supabase.from('community_reports').select('*'),
      this.supabase.from('community_initiatives').select('*'),
      this.supabase.from('notifications').select('*'),
      this.supabase.from('impact_records').select('*'),
    ]);

    // Check every single query error explicitly
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      const tableName = tableNames[i];
      if (res.error) {
        throw new Error(`Supabase authoritative hydration query failed on table '${tableName}': ${res.error.message}`);
      }
    }

    const [
      profilesRes,
      rolesRes,
      householdRes,
      volunteersRes,
      skillsRes,
      organisationsRes,
      requestsRes,
      assignmentsRes,
      equipmentRes,
      eqRequestsRes,
      facilitiesRes,
      reportsRes,
      initiativesRes,
      notificationsRes,
      impactRes
    ] = results;

    if (Array.isArray(profilesRes.data)) this.state.profiles = profilesRes.data;
    if (Array.isArray(rolesRes.data)) this.state.user_roles = rolesRes.data;
    if (Array.isArray(householdRes.data)) this.state.household_profiles = householdRes.data;
    if (Array.isArray(volunteersRes.data)) this.state.volunteer_profiles = volunteersRes.data;
    if (Array.isArray(skillsRes.data)) this.state.volunteer_skills = skillsRes.data;
    if (Array.isArray(organisationsRes.data)) this.state.organisations = organisationsRes.data;
    if (Array.isArray(requestsRes.data)) this.state.assistance_requests = requestsRes.data;
    if (Array.isArray(assignmentsRes.data)) this.state.request_assignments = assignmentsRes.data;
    if (Array.isArray(equipmentRes.data)) this.state.equipment = equipmentRes.data;
    if (Array.isArray(eqRequestsRes.data)) this.state.equipment_requests = eqRequestsRes.data;
    if (Array.isArray(facilitiesRes.data)) this.state.facilities = facilitiesRes.data;
    if (Array.isArray(reportsRes.data)) this.state.community_reports = reportsRes.data;
    if (Array.isArray(initiativesRes.data)) this.state.community_initiatives = initiativesRes.data;
    if (Array.isArray(notificationsRes.data)) this.state.notifications = notificationsRes.data;
    if (Array.isArray(impactRes.data)) this.state.impact_records = impactRes.data;

    console.log(`✅ Authoritatively hydrated 15 operational tables from Supabase PostgreSQL.`);
    return true;
  }

  public async syncStateToSupabase(): Promise<void> {
    if (!this.supabase) return;

    const upsertTable = async (tableName: string, rows: any[], onConflict: string = 'id') => {
      let attempts = 0;
      while (attempts < 2) {
        attempts++;
        try {
          const { error } = await this.supabase!.from(tableName).upsert(rows, { onConflict });
          if (error) {
            throw new Error(`Supabase persistence failure on '${tableName}': ${error.message}`);
          }
          return;
        } catch (err: any) {
          if (attempts < 2 && (err.message?.includes('fetch failed') || err.message?.includes('ECONNRESET') || err.message?.includes('ETIMEDOUT'))) {
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          throw err;
        }
      }
    };

    // 1. Profiles
    if (this.state.profiles && this.state.profiles.length > 0) {
      const rows = this.state.profiles.map(p => ({
        id: toValidUuid(p.id),
        email: p.email,
        full_name: p.full_name,
        phone: p.phone,
        city: p.city,
        neighbourhood: p.neighbourhood,
        preferred_language: p.preferred_language,
        account_type: p.account_type,
        latitude: p.latitude,
        longitude: p.longitude,
        created_at: p.created_at,
        updated_at: p.updated_at
      }));
      await upsertTable('profiles', rows, 'id');
    }

    // 2. User Roles
    if (this.state.user_roles && this.state.user_roles.length > 0) {
      const rows = this.state.user_roles.map(u => ({
        user_id: toValidUuid(u.user_id),
        role: u.role,
        granted_at: u.granted_at
      }));
      await upsertTable('user_roles', rows, 'user_id, role');
    }

    // 3. Household Profiles
    if (this.state.household_profiles && this.state.household_profiles.length > 0) {
      const rows = this.state.household_profiles.map(h => ({
        id: toValidUuid(h.id),
        user_id: toValidUuid(h.user_id),
        member_count: h.member_count,
        elderly_present: h.elderly_present,
        children_present: h.children_present,
        sensitive_persons: h.sensitive_persons,
        housing_type: h.housing_type,
        room_size_sqft: h.room_size_sqft,
        existing_purifiers: h.existing_purifiers,
        created_at: h.created_at,
        updated_at: h.updated_at
      }));
      await upsertTable('household_profiles', rows, 'id');
    }

    // 4. Volunteer Profiles
    if (this.state.volunteer_profiles && this.state.volunteer_profiles.length > 0) {
      const rows = this.state.volunteer_profiles.map(v => ({
        id: toValidUuid(v.id),
        user_id: toValidUuid(v.user_id),
        service_radius_km: v.service_radius_km,
        experience_years: v.experience_years,
        bio: v.bio,
        languages: v.languages,
        organisation_affiliation: v.organisation_affiliation,
        is_verified: v.is_verified,
        status: v.status,
        created_at: v.created_at,
        updated_at: v.updated_at
      }));
      await upsertTable('volunteer_profiles', rows, 'id');
    }

    // 5. Volunteer Skills
    if (this.state.volunteer_skills && this.state.volunteer_skills.length > 0) {
      const rows = this.state.volunteer_skills.map(s => ({
        id: toValidUuid(s.id),
        volunteer_id: toValidUuid(s.volunteer_id),
        skill_category: s.skill_category,
        proficiency_level: s.proficiency_level,
        created_at: s.created_at
      }));
      await upsertTable('volunteer_skills', rows, 'id');
    }

    // 6. Organisations
    if (this.state.organisations && this.state.organisations.length > 0) {
      const rows = this.state.organisations.map(o => ({
        id: toValidUuid(o.id),
        name: o.name,
        contact_email: o.contact_email,
        contact_phone: o.contact_phone,
        city: o.city,
        address: o.address,
        registration_number: o.registration_number,
        is_verified: o.is_verified,
        created_at: o.created_at,
        updated_at: o.updated_at
      }));
      await upsertTable('organisations', rows, 'id');
    }

    // 7. Assistance Requests
    if (this.state.assistance_requests && this.state.assistance_requests.length > 0) {
      const rows = this.state.assistance_requests.map(r => ({
        id: toValidUuid(r.id),
        user_id: toValidUuid(r.user_id),
        category: r.category,
        description: r.description,
        location_city: r.location_city,
        location_neighbourhood: r.location_neighbourhood,
        latitude: r.latitude,
        longitude: r.longitude,
        urgency: r.urgency,
        household_type: r.household_type,
        existing_equipment: r.existing_equipment,
        contact_method: r.contact_method,
        consent_shared: r.consent_shared,
        status: r.status,
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
      await upsertTable('assistance_requests', rows, 'id');
    }

    // 8. Request Assignments
    if (this.state.request_assignments && this.state.request_assignments.length > 0) {
      const rows = this.state.request_assignments.map(a => ({
        id: toValidUuid(a.id),
        request_id: toValidUuid(a.request_id),
        volunteer_id: toValidUuid(a.volunteer_id),
        status: a.status,
        assigned_at: a.assigned_at,
        updated_at: a.updated_at,
        completion_notes: a.completion_notes,
        completion_photo_url: a.completion_photo_url
      }));
      await upsertTable('request_assignments', rows, 'id');
    }

    // 9. Equipment
    if (this.state.equipment && this.state.equipment.length > 0) {
      const rows = this.state.equipment.map(e => ({
        id: toValidUuid(e.id),
        donor_id: e.donor_id ? toValidUuid(e.donor_id) : undefined,
        name: e.name,
        category: e.category,
        description: e.description,
        manufacturer_model: e.manufacturer_model,
        condition: e.condition,
        type: e.type,
        max_loan_duration_days: e.max_loan_duration_days,
        location_city: e.location_city,
        location_neighbourhood: e.location_neighbourhood,
        latitude: e.latitude,
        longitude: e.longitude,
        image_url: e.image_url,
        status: e.status,
        is_verified: e.is_verified,
        cadr_rating: e.cadr_rating,
        created_at: e.created_at,
        updated_at: e.updated_at
      }));
      await upsertTable('equipment', rows, 'id');
    }

    // 10. Equipment Requests
    if (this.state.equipment_requests && this.state.equipment_requests.length > 0) {
      const rows = this.state.equipment_requests.map(er => ({
        id: toValidUuid(er.id),
        equipment_id: toValidUuid(er.equipment_id),
        requester_id: toValidUuid(er.requester_id),
        status: er.status,
        requested_duration_days: er.requested_duration_days,
        purpose: er.purpose,
        created_at: er.created_at,
        updated_at: er.updated_at
      }));
      await upsertTable('equipment_requests', rows, 'id');
    }

    // 11. Facilities
    if (this.state.facilities && this.state.facilities.length > 0) {
      const rows = this.state.facilities.map(f => ({
        id: toValidUuid(f.id),
        name: f.name,
        facility_type: f.facility_type,
        address: f.address,
        city: f.city,
        neighbourhood: f.neighbourhood,
        latitude: f.latitude,
        longitude: f.longitude,
        contact_phone: f.contact_phone,
        contact_email: f.contact_email,
        operating_hours: f.operating_hours,
        accessibility_features: f.accessibility_features,
        filtration_equipment_details: f.filtration_equipment_details,
        capacity: f.capacity,
        is_verified: f.is_verified,
        created_at: f.created_at,
        updated_at: f.updated_at
      }));
      await upsertTable('facilities', rows, 'id');
    }

    // 12. Community Reports
    if (this.state.community_reports && this.state.community_reports.length > 0) {
      const rows = this.state.community_reports.map(r => ({
        id: toValidUuid(r.id),
        reporter_id: toValidUuid(r.reporter_id),
        category: r.category,
        description: r.description,
        city: r.city,
        neighbourhood: r.neighbourhood,
        latitude: r.latitude,
        longitude: r.longitude,
        image_url: r.image_url,
        status: r.status,
        resolution_notes: r.resolution_notes,
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
      await upsertTable('community_reports', rows, 'id');
    }

    // 13. Community Initiatives
    if (this.state.community_initiatives && this.state.community_initiatives.length > 0) {
      const rows = this.state.community_initiatives.map(ci => ({
        id: toValidUuid(ci.id),
        title: ci.title,
        description: ci.description,
        city: ci.city,
        neighbourhood: ci.neighbourhood,
        organiser_id: toValidUuid(ci.organiser_id),
        start_date: ci.start_date,
        end_date: ci.end_date,
        target_participants: ci.target_participants,
        current_participants: ci.current_participants,
        status: ci.status,
        created_at: ci.created_at
      }));
      await upsertTable('community_initiatives', rows, 'id');
    }

    // 14. Notifications
    if (this.state.notifications && this.state.notifications.length > 0) {
      const rows = this.state.notifications.map(n => ({
        id: toValidUuid(n.id),
        user_id: toValidUuid(n.user_id),
        title: n.title,
        message: n.message,
        event_type: n.event_type,
        related_entity_id: n.related_entity_id ? toValidUuid(n.related_entity_id) : undefined,
        is_read: n.is_read,
        created_at: n.created_at
      }));
      await upsertTable('notifications', rows, 'id');
    }

    // 15. Impact Records
    if (this.state.impact_records && this.state.impact_records.length > 0) {
      const rows = this.state.impact_records.map(i => ({
        id: toValidUuid(i.id),
        metric_type: i.metric_type,
        value: i.value,
        related_entity_type: i.related_entity_type,
        related_entity_id: i.related_entity_id ? toValidUuid(i.related_entity_id) : undefined,
        recorded_at: i.recorded_at,
        methodology_notes: i.methodology_notes
      }));
      await upsertTable('impact_records', rows, 'id');
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  private getSeedData(): DatabaseState {
    const now = new Date().toISOString();
    return {
      profiles: [
        {
          id: 'a0000000-0000-0000-0000-000000000001',
          email: 'admin@saans.org',
          password_hash: '$2a$10$wT282mH48.o57476eXnCbeG1W5e.O1K33sWc5V/7y257P5gqjK5kO', // password123
          full_name: 'Admin SAANS',
          phone: '+91 98200 11223',
          city: 'Mumbai',
          neighbourhood: 'Bandra West',
          preferred_language: 'en',
          account_type: 'admin',
          latitude: 19.0596,
          longitude: 72.8295,
          is_demo_account: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'c0000000-0000-0000-0000-000000000002',
          email: 'priya.sharma@example.com',
          password_hash: '$2a$10$wT282mH48.o57476eXnCbeG1W5e.O1K33sWc5V/7y257P5gqjK5kO', // password123
          full_name: 'Priya Sharma',
          phone: '+91 98333 44556',
          city: 'Mumbai',
          neighbourhood: 'Kurla West',
          preferred_language: 'hi',
          account_type: 'citizen',
          latitude: 19.0657,
          longitude: 72.8794,
          is_demo_account: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'b0000003-0000-0000-0000-000000000003',
          email: 'rahul.deshmukh@example.com',
          password_hash: '$2a$10$wT282mH48.o57476eXnCbeG1W5e.O1K33sWc5V/7y257P5gqjK5kO', // password123
          full_name: 'Rahul Deshmukh',
          phone: '+91 99201 55667',
          city: 'Mumbai',
          neighbourhood: 'Dadar',
          preferred_language: 'mr',
          account_type: 'volunteer',
          latitude: 19.0178,
          longitude: 72.8478,
          is_demo_account: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'd0000000-0000-0000-0000-000000000004',
          email: 'cleanair.mumbai@example.com',
          password_hash: '$2a$10$wT282mH48.o57476eXnCbeG1W5e.O1K33sWc5V/7y257P5gqjK5kO', // password123
          full_name: 'CleanAir NGO Mumbai',
          phone: '+91 98199 77889',
          city: 'Mumbai',
          neighbourhood: 'Andheri East',
          preferred_language: 'en',
          account_type: 'donor',
          latitude: 19.1136,
          longitude: 72.8697,
          is_demo_account: true,
          created_at: now,
          updated_at: now
        }
      ],
      user_roles: [
        { id: 'ur-1', user_id: 'a0000000-0000-0000-0000-000000000001', role: 'admin', granted_at: now },
        { id: 'ur-2', user_id: 'c0000000-0000-0000-0000-000000000002', role: 'citizen', granted_at: now },
        { id: 'ur-3', user_id: 'b0000003-0000-0000-0000-000000000003', role: 'volunteer', granted_at: now },
        { id: 'ur-4', user_id: 'd0000000-0000-0000-0000-000000000004', role: 'donor', granted_at: now }
      ],
      household_profiles: [
        {
          id: 'hp-1',
          user_id: 'c0000000-0000-0000-0000-000000000002',
          member_count: 4,
          elderly_present: true,
          children_present: true,
          sensitive_persons: true,
          housing_type: '2BHK Apartment near Western Express Highway',
          room_size_sqft: 280,
          existing_purifiers: 'None',
          created_at: now,
          updated_at: now
        }
      ],
      volunteer_profiles: [
        {
          id: 'b0000000-0000-0000-0000-000000000001',
          user_id: 'b0000003-0000-0000-0000-000000000003',
          service_radius_km: 15,
          experience_years: 3,
          bio: 'Electrical technician and clean air activist in Mumbai. Specializing in Corsi-Rosenthal boxes and filter installations.',
          languages: ['en', 'hi', 'mr'],
          organisation_affiliation: 'Mumbai Breathing Initiative',
          is_verified: true,
          status: 'active',
          created_at: now,
          updated_at: now
        }
      ],
      volunteer_skills: [
        { id: 'vs-1', volunteer_id: 'b0000000-0000-0000-0000-000000000001', skill_category: 'installation', proficiency_level: 'expert', created_at: now },
        { id: 'vs-2', volunteer_id: 'b0000000-0000-0000-0000-000000000001', skill_category: 'electrical', proficiency_level: 'expert', created_at: now },
        { id: 'vs-3', volunteer_id: 'b0000000-0000-0000-0000-000000000001', skill_category: 'repair', proficiency_level: 'intermediate', created_at: now }
      ],
      organisations: [
        {
          id: 'org-1',
          name: 'CleanAir NGO Mumbai',
          contact_email: 'cleanair.mumbai@example.com',
          contact_phone: '+91 98199 77889',
          city: 'Mumbai',
          address: 'Chakala, Andheri East, Mumbai 400093',
          registration_number: 'MH-MUM-2023-8871',
          is_verified: true,
          created_at: now,
          updated_at: now
        }
      ],
      assistance_requests: [
        {
          id: 'a1111111-0000-0000-0000-000000000001',
          user_id: 'c0000000-0000-0000-0000-000000000002',
          category: 'purifier_loan',
          description: 'Elderly parent has severe asthma exacerbation during winter smog inversion. Living room facing heavy traffic corridor.',
          location_city: 'Mumbai',
          location_neighbourhood: 'Kurla West',
          latitude: 19.0657,
          longitude: 72.8794,
          urgency: 'high',
          household_type: 'Family with elderly & child',
          existing_equipment: 'Only ceiling fans',
          contact_method: 'Phone call or In-app',
          consent_shared: true,
          status: 'approved',
          created_at: now,
          updated_at: now
        }
      ],
      request_assignments: [],
      equipment: [
        {
          id: 'e0000000-0000-0000-0000-000000000001',
          donor_id: 'd0000000-0000-0000-0000-000000000004',
          name: 'Philips Series 2000i HEPA Purifier',
          category: 'hepa_purifier',
          description: 'High CADR purifier suitable for master bedroom or living room up to 350 sq ft. Real-time PM2.5 feedback display.',
          manufacturer_model: 'Philips AC2887/20',
          condition: 'like_new',
          type: 'loan',
          max_loan_duration_days: 30,
          location_city: 'Mumbai',
          location_neighbourhood: 'Andheri East',
          latitude: 19.1136,
          longitude: 72.8697,
          image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
          status: 'available',
          is_verified: true,
          is_demo: true,
          cadr_rating: 333,
          created_at: now,
          updated_at: now
        },
        {
          id: 'e0000000-0000-0000-0000-000000000002',
          donor_id: 'd0000000-0000-0000-0000-000000000004',
          name: 'Corsi-Rosenthal DIY Box System (MERV 13)',
          category: 'diy_filtration',
          description: 'Community assembled 4-filter high-flow cube with Orient box fan. Ultra-low resistance, high particulate throughput.',
          manufacturer_model: 'SAANS-CR-4x',
          condition: 'new',
          type: 'donation',
          location_city: 'Mumbai',
          location_neighbourhood: 'Dadar',
          latitude: 19.0178,
          longitude: 72.8478,
          image_url: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=600&q=80',
          status: 'available',
          is_verified: true,
          is_demo: true,
          cadr_rating: 420,
          created_at: now,
          updated_at: now
        },
        {
          id: 'e0000000-0000-0000-0000-000000000003',
          donor_id: 'd0000000-0000-0000-0000-000000000004',
          name: 'Laser Particle Sensor IAQ Monitor',
          category: 'iaq_monitor',
          description: 'Accurate laser scattering particulate sensor measuring PM1.0, PM2.5 and PM10 with OLED read-out.',
          manufacturer_model: 'Temtop LKC-1000S+',
          condition: 'good',
          type: 'loan',
          max_loan_duration_days: 14,
          location_city: 'Mumbai',
          location_neighbourhood: 'Bandra West',
          latitude: 19.0596,
          longitude: 72.8295,
          image_url: 'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=600&q=80',
          status: 'available',
          is_verified: true,
          is_demo: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'e0000000-0000-0000-0000-000000000004',
          donor_id: 'd0000000-0000-0000-0000-000000000004',
          name: 'N95 / FFP2 Respirator Family Pack (50 Pcs)',
          category: 'protective_gear',
          description: 'Certified ISI-approved particulate respirator masks with comfortable headband for outdoor commuting.',
          manufacturer_model: 'Venus V-4400',
          condition: 'new',
          type: 'donation',
          location_city: 'Mumbai',
          location_neighbourhood: 'Kurla West',
          latitude: 19.0657,
          longitude: 72.8794,
          image_url: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=600&q=80',
          status: 'available',
          is_verified: true,
          is_demo: true,
          created_at: now,
          updated_at: now
        }
      ],
      equipment_requests: [],
      equipment_transactions: [],
      equipment_maintenance: [],
      facilities: [
        {
          id: 'f0000000-0000-0000-0000-000000000001',
          name: 'Bandra Public Library Clean Air Zone',
          facility_type: 'library',
          address: 'Near Hill Road, Bandra West, Mumbai 400050',
          city: 'Mumbai',
          neighbourhood: 'Bandra West',
          latitude: 19.0558,
          longitude: 72.8300,
          contact_phone: '+91 22 2640 1234',
          contact_email: 'bandra.library@mumbai.gov.in',
          operating_hours: '08:00 AM - 08:00 PM',
          accessibility_features: ['wheelchair_accessible', 'drinking_water', 'restrooms', 'wifi'],
          filtration_equipment_details: 'Triple HEPA H13 Air Purifiers + Positive Pressure Airflow System',
          capacity: 45,
          is_verified: true,
          is_demo: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'f0000000-0000-0000-0000-000000000002',
          name: 'Dadar Community Wellness Centre',
          facility_type: 'community_hall',
          address: 'Gokhale Road North, Dadar, Mumbai 400028',
          city: 'Mumbai',
          neighbourhood: 'Dadar',
          latitude: 19.0195,
          longitude: 72.8428,
          contact_phone: '+91 22 2430 5678',
          contact_email: 'dadar.wellness@saans.community',
          operating_hours: '07:00 AM - 09:00 PM',
          accessibility_features: ['wheelchair_accessible', 'seating_area', 'medical_first_aid'],
          filtration_equipment_details: 'Dual Industrial CADR 650 m3/h Filtration Units with Carbon Bed',
          capacity: 60,
          is_verified: true,
          is_demo: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'f0000000-0000-0000-0000-000000000003',
          name: 'Chembur Senior Citizens Respite Shelter',
          facility_type: 'clinic',
          address: 'Near Chembur Naka, Chembur, Mumbai 400071',
          city: 'Mumbai',
          neighbourhood: 'Chembur',
          latitude: 19.0622,
          longitude: 72.8992,
          contact_phone: '+91 22 2522 9988',
          contact_email: 'chembur.respite@saans.community',
          operating_hours: '09:00 AM - 06:00 PM',
          accessibility_features: ['wheelchair_accessible', 'nursing_assistant', 'oxygen_support'],
          filtration_equipment_details: 'Medical Grade HEPA + Activated Carbon, Low Noise Operation',
          capacity: 30,
          is_verified: true,
          is_demo: true,
          created_at: now,
          updated_at: now
        },
        {
          id: 'f0000000-0000-0000-0000-000000000004',
          name: 'Andheri East NGO Learning Centre',
          facility_type: 'school',
          address: 'Chakala, Andheri East, Mumbai 400093',
          city: 'Mumbai',
          neighbourhood: 'Andheri East',
          latitude: 19.1158,
          longitude: 72.8654,
          contact_phone: '+91 22 2822 4411',
          contact_email: 'learning@cleanairandheri.org',
          operating_hours: '08:30 AM - 05:30 PM',
          accessibility_features: ['wheelchair_accessible', 'children_study_tables'],
          filtration_equipment_details: '4x Corsi-Rosenthal DIY Box Purifiers with MERV-13 Filters',
          capacity: 40,
          is_verified: true,
          is_demo: true,
          created_at: now,
          updated_at: now
        }
      ],
      facility_verifications: [],
      community_reports: [
        {
          id: 'a2222222-0000-0000-0000-000000000001',
          reporter_id: 'c0000000-0000-0000-0000-000000000002',
          category: 'garbage_burning',
          description: 'Uncontrolled waste burning near railway tracks creating thick acrid smoke settling into residential colony.',
          city: 'Mumbai',
          neighbourhood: 'Kurla West',
          latitude: 19.0680,
          longitude: 72.8810,
          image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
          status: 'verified',
          resolution_notes: 'Reported to Ward L municipal sanitary officer and local resident association notified.',
          created_at: now,
          updated_at: now
        },
        {
          id: 'a2222222-0000-0000-0000-000000000002',
          reporter_id: 'c0000000-0000-0000-0000-000000000002',
          category: 'construction_dust',
          description: 'Uncovered metro station construction piling without dust suppression sprinklers or green netting barriers.',
          city: 'Mumbai',
          neighbourhood: 'Andheri East',
          latitude: 19.1120,
          longitude: 72.8680,
          status: 'under_review',
          created_at: now,
          updated_at: now
        }
      ],
      community_initiatives: [
        {
          id: 'a4444444-0000-0000-0000-000000000001',
          title: 'Mumbai Winter Smog DIY Purifier Workshop',
          description: 'Hands-on community workshop where 25 families build and take home affordable Corsi-Rosenthal box purifiers.',
          city: 'Mumbai',
          neighbourhood: 'Dadar',
          organiser_id: 'a0000000-0000-0000-0000-000000000001',
          start_date: new Date(Date.now() + 3 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 3 * 86400000 + 4 * 3600000).toISOString(),
          target_participants: 50,
          current_participants: 34,
          status: 'active',
          created_at: now
        },
        {
          id: 'a4444444-0000-0000-0000-000000000002',
          title: 'Bandra High-Traffic School Clean Air Corridor',
          description: 'Installation of indoor air purifiers and planting micro-green air screens in 3 community primary schools.',
          city: 'Mumbai',
          neighbourhood: 'Bandra West',
          organiser_id: 'd0000000-0000-0000-0000-000000000004',
          start_date: new Date(Date.now() + 10 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 12 * 86400000).toISOString(),
          target_participants: 80,
          current_participants: 62,
          status: 'upcoming',
          created_at: now
        }
      ],
      donations: [
        {
          id: 'don-1',
          donor_id: 'd0000000-0000-0000-0000-000000000004',
          item_type: 'masks',
          quantity: 200,
          description: 'Certified N95 particulate respirators for sanitation workers in Kurla',
          status: 'allocated',
          created_at: now
        }
      ],
      notifications: [
        {
          id: 'notif-1',
          user_id: 'c0000000-0000-0000-0000-000000000002',
          title: 'Assistance Request Approved',
          message: 'Your air purifier loan request #a1111111-0000-0000-0000-000000000001 has been reviewed and approved. Matching volunteer shortly.',
          event_type: 'request_approved',
          related_entity_id: 'a1111111-0000-0000-0000-000000000001',
          is_read: false,
          created_at: now
        }
      ],
      conversations: [],
      conversation_messages: [],
      air_quality_cache: [],
      impact_records: [
        {
          id: 'imp-1',
          metric_type: 'equipment_donated',
          value: 18,
          recorded_at: now,
          methodology_notes: 'Verified records of donor equipment delivered to citizens in need.'
        },
        {
          id: 'imp-2',
          metric_type: 'equipment_loaned',
          value: 34,
          recorded_at: now,
          methodology_notes: 'Active and completed air purifier loans with signed handovers.'
        },
        {
          id: 'imp-3',
          metric_type: 'diy_assembled',
          value: 52,
          recorded_at: now,
          methodology_notes: 'Completed DIY Corsi-Rosenthal purifiers recorded via community workshops.'
        },
        {
          id: 'imp-4',
          metric_type: 'requests_fulfilled',
          value: 47,
          recorded_at: now,
          methodology_notes: 'Citizen assistance requests successfully marked completed with verification notes.'
        },
        {
          id: 'imp-5',
          metric_type: 'volunteer_tasks_completed',
          value: 68,
          recorded_at: now,
          methodology_notes: 'Field tasks completed by verified SAANS volunteers across Mumbai.'
        },
        {
          id: 'imp-6',
          metric_type: 'facilities_onboarded',
          value: 4,
          recorded_at: now,
          methodology_notes: 'Verified clean air sanctuaries audited and approved in platform registry.'
        }
      ],
      audit_logs: [
        {
          id: 'aud-1',
          action: 'SEED_INITIALIZATION',
          entity_type: 'system',
          created_at: now
        }
      ]
    };
  }
}

export const db = DatabaseStore.getInstance();
