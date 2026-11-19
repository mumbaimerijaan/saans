import { AQIReport, AssistanceRequest, Equipment, Facility, CommunityReport, Notification, SystemStatus, User } from '../types';

const rawBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('saans_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  async login(data: { email: string; password?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, password: data.password || 'password123' }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  async getMe(): Promise<{ user: User; household?: any; volunteer?: any }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch current user');
    return json;
  },

  async updateHousehold(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/household`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update household profile');
    return json;
  },

  // Air Quality
  async getCurrentAirQuality(lat: number = 19.0760, lon: number = 72.8777, city: string = 'Mumbai', neighbourhood: string = 'Bandra West'): Promise<AQIReport> {
    const res = await fetch(`${API_BASE}/air-quality/current?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}&neighbourhood=${encodeURIComponent(neighbourhood)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load air quality');
    return json;
  },

  async calculateCustomAqi(pollutant: string, concentration: number): Promise<any> {
    const res = await fetch(`${API_BASE}/air-quality/calculate-aqi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollutant, concentration }),
    });
    return res.json();
  },

  // Assistance Requests
  async getRequests(): Promise<{ requests: AssistanceRequest[] }> {
    const res = await fetch(`${API_BASE}/requests`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load requests');
    return json;
  },

  async createRequest(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create request');
    return json;
  },

  async updateRequestStatus(id: string, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update request');
    return json;
  },

  async getRequestMatches(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests/${id}/matches`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async assignVolunteerToRequest(id: string, volunteerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/requests/${id}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ volunteerId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Assignment failed');
    return json;
  },

  // Volunteers
  async getVolunteerTasks(): Promise<any> {
    const res = await fetch(`${API_BASE}/volunteers/tasks`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load volunteer tasks');
    return json;
  },

  async saveVolunteerProfile(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/volunteers/profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save volunteer profile');
    return json;
  },

  async acceptVolunteerTask(assignmentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/volunteers/tasks/${assignmentId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async completeVolunteerTask(assignmentId: string, notes?: string, photoUrl?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/volunteers/tasks/${assignmentId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes, photoUrl }),
    });
    return res.json();
  },

  // Equipment Library
  async getEquipment(params: Record<string, string> = {}): Promise<{ equipment: Equipment[] }> {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/equipment${q ? `?${q}` : ''}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load equipment');
    return json;
  },

  async addEquipment(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/equipment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to add equipment');
    return json;
  },

  async requestEquipment(id: string, purpose: string, durationDays: number): Promise<any> {
    const res = await fetch(`${API_BASE}/equipment/${id}/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ purpose, durationDays }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to request equipment');
    return json;
  },

  // Facilities
  async getFacilities(params: Record<string, string> = {}): Promise<{ facilities: Facility[] }> {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/facilities${q ? `?${q}` : ''}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load facilities');
    return json;
  },

  async submitFacility(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/facilities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit facility');
    return json;
  },

  async verifyFacility(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/facilities/${id}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Reports
  async getReports(): Promise<{ reports: CommunityReport[] }> {
    const res = await fetch(`${API_BASE}/reports`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load reports');
    return json;
  },

  async submitReport(data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit pollution report');
    return json;
  },

  async updateReportStatus(id: string, status: string, resolutionNotes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, resolutionNotes }),
    });
    return res.json();
  },

  // AI Assistant
  async sendAiChat(messages: Array<{ role: string; content: string }>, language: string = 'en', activeAqi?: number | null, city?: string, neighbourhood?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ messages, language, activeAqi, city, neighbourhood }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'AI request failed');
    return json;
  },

  async calculateDiyCadr(lengthFt: number, widthFt: number, heightFt: number = 10, targetACH: number = 5): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/diy-cadr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lengthFt, widthFt, heightFt, targetACH }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'CADR calculation failed');
    return json;
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) return { notifications: [], unreadCount: 0 };
    return json;
  },

  async markNotificationRead(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Impact Engine
  async getImpact(): Promise<any> {
    const res = await fetch(`${API_BASE}/impact`);
    return res.json();
  },

  // Admin Overview
  async getAdminOverview(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/overview`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getAdminUsers(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // System Status
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    return res.json();
  }
};
