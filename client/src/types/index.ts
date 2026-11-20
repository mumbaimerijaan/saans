export type UserRole = 'citizen' | 'volunteer' | 'donor' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  city: string;
  neighbourhood: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  accountType: UserRole;
  roles: string[];
  latitude?: number;
  longitude?: number;
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
}

export interface PollutantDetail {
  code: string;
  name: string;
  concentration: number;
  unit: string;
  subIndex?: number;
  category?: string;
  sourceType: 'modelled_forecast' | 'sensor_measurement';
}

export interface AQIReport {
  city: string;
  neighbourhood?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  sourceAttribution: {
    primaryProvider: string;
    modelOrStationName: string;
    isModelledForecast: boolean;
    license: string;
  };
  indianAqi: {
    index: number | null;
    category: string;
    dominantPollutant: string | null;
    isAvailable: boolean;
    methodology: string;
  };
  foreignIndices: {
    europeanAqi: number | null;
    usAqi: number | null;
    note: string;
  };
  pollutants: Record<string, PollutantDetail>;
  hourlyForecast: Array<{
    time: string;
    pm25: number;
    pm10: number;
    no2: number;
    predictedIndianAqi: number | null;
  }>;
  nearbyStations: Array<{
    id: string;
    name: string;
    distanceKm: number;
    latitude: number;
    longitude: number;
    lastUpdated: string;
    measurements: Record<string, number>;
  }>;
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
  status: 'submitted' | 'under_review' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'rejected' | 'cancelled' | 'on_hold';
  creatorName?: string;
  creatorEmail?: string;
  creatorPhone?: string;
  assignedVolunteerName?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  donor_id?: string;
  donorName?: string;
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
  cadr_rating?: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface CommunityReport {
  id: string;
  category: 'garbage_burning' | 'construction_dust' | 'industrial_smoke' | 'roadside_burning' | 'excessive_dust' | 'other';
  description: string;
  city: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  status: 'submitted' | 'under_review' | 'verified' | 'rejected' | 'resolved';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
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

export interface SystemStatus {
  status: string;
  timestamp: string;
  environment: string;
  integrations: {
    supabase: {
      isConfigured: boolean;
      isConnected: boolean;
      persistenceMode: string;
      urlHost: string;
    };
    openrouter: {
      isConfigured: boolean;
      primaryModel: string;
      fallbackModel: string;
      mode: string;
    };
    openMeteo: {
      isResponding: boolean;
      latencyMs: number;
      service: string;
    };
    openAQ: {
      isConfigured: boolean;
      service: string;
    };
    openStreetMap: {
      isFunctioning: boolean;
      tileUrl: string;
    };
  };
}

export interface VolunteerProfile {
  id: string;
  user_id: string;
  skills: string[];
  vehicle_type: string;
  max_travel_radius_km: number;
  is_active: boolean;
  tasks_completed_count: number;
  rating: number;
}

export interface VolunteerMatch {
  volunteerProfile: VolunteerProfile;
  volunteerUser: User;
  distanceKm: number;
  matchScore: number;
  rationale: string;
}

export interface VolunteerTask {
  assignment: {
    id: string;
    request_id: string;
    volunteer_id: string;
    status: 'assigned' | 'in_progress' | 'accepted' | 'completed' | 'cancelled';
    assigned_at: string;
    completed_at?: string;
    completion_notes?: string;
  };
  request: AssistanceRequest;
  creatorName?: string;
  creatorPhone?: string;
}

export interface VolunteerTasksResponse {
  volunteerProfile: VolunteerProfile | null;
  activeTasks: VolunteerTask[];
  completedTasks: VolunteerTask[];
  availableRequests: AssistanceRequest[];
}

export interface DiyCadrResult {
  roomVolumeCuFt: number;
  roomVolumeM3: number;
  targetACH: number;
  recommendedCadrCFM: number;
  recommendedCadrM3H: number;
  estimatedBoxesNeeded: number;
  recommendedFanSizeInches: number;
  safetyGuidelines: string[];
  safetyNotes: string[];
}

export interface AiChatResult {
  content: string;
  modelUsed: string;
  isFallback?: boolean;
}

export interface ImpactMetrics {
  equipmentDonated: number;
  equipmentLoaned: number;
  requestsFulfilled: number;
  volunteerTasksCompleted: number;
  facilitiesOnboarded: number;
  reportsResolved: number;
  diyAssembled: number;
  estimatedPeopleReached: number;
}

export interface ImpactResponse {
  metrics: ImpactMetrics;
  methodology: {
    source: string;
    transparencyNote: string;
    peopleReachedFormula: string;
  };
  recentRecords: Array<{
    id?: string;
    metric_type: string;
    value: number;
    recorded_at: string;
  }>;
}

export interface AdminStats {
  totalUsers: number;
  totalRequests: number;
  openRequests?: number;
  pendingRequests?: number;
  totalEquipment?: number;
  equipmentCount?: number;
  availableEquipment?: number;
  verifiedFacilities?: number;
  activeReports?: number;
  pendingReports?: number;
  activeVolunteers?: number;
}

export interface AdminOverviewResponse {
  stats: AdminStats;
  pendingRequests: AssistanceRequest[];
  unverifiedFacilities: Facility[];
  unverifiedReports: CommunityReport[];
}
