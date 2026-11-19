import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AssistanceRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  HeartHandshake,
  PlusCircle,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Filter,
  UserCheck,
  Send,
  HelpCircle,
  Shield,
  Phone,
  MessageSquare
} from 'lucide-react';

const CATEGORIES = [
  { id: 'purifier_loan', label: 'Air Purifier Loan', desc: 'Borrow an idle HEPA purifier for severe smog weeks' },
  { id: 'purifier_donation', label: 'Air Purifier Donation', desc: 'Permanent purifier unit for low-income or vulnerable family' },
  { id: 'diy_installation', label: 'DIY Purifier Assembly Assistance', desc: 'A volunteer builds a Corsi-Rosenthal unit in your home' },
  { id: 'filter_replacement', label: 'Filter Replacement Help', desc: 'Need replacement HEPA / MERV 13 filter cartridge' },
  { id: 'equipment_repair', label: 'Equipment Repair & Maintenance', desc: 'Motor check, noisy fan repair, or electrical safety check' },
  { id: 'protective_gear', label: 'Protective Equipment (N95 Masks)', desc: 'Respirator masks for outdoor workers or families' },
  { id: 'iaq_assessment', label: 'Indoor Air Quality Assessment', desc: 'Request a volunteer to measure PM2.5 in your residence' },
  { id: 'facility_access', label: 'Clean-Air Sanctuary Access', desc: 'Assistance finding nearby public filtered space' },
  { id: 'other', label: 'Other Community Assistance', desc: 'General smog response coordination' },
];

const MUMBAI_AREAS = [
  'Bandra West', 'Kurla West', 'Dadar', 'Andheri East',
  'Chembur', 'Worli', 'Colaba', 'Malad', 'Ghatkopar', 'Thane West'
];

export const GetHelp: React.FC = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Wizard Form State
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [description, setDescription] = useState('');
  const [neighbourhood, setNeighbourhood] = useState(MUMBAI_AREAS[0]);
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [householdType, setHouseholdType] = useState('Family with elderly & children');
  const [existingEquipment, setExistingEquipment] = useState('None');
  const [contactMethod, setContactMethod] = useState('In-app message & phone');
  const [consentShared, setConsentShared] = useState(true);

  const loadRequests = async () => {
    try {
      const data = await api.getRequests();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      alert('Please provide at least 10 characters describing your need.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createRequest({
        category,
        description,
        locationCity: 'Mumbai',
        locationNeighbourhood: neighbourhood,
        urgency,
        householdType,
        existingEquipment,
        contactMethod,
        consentShared
      });
      setSuccessMessage('Assistance request created successfully! Our community volunteers have been notified.');
      setDescription('');
      setShowWizard(false);
      await loadRequests();
      await refreshNotifications();
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string }> = {
      submitted: { label: 'Submitted', class: 'bg-slate-800 text-slate-300 border-slate-700' },
      under_review: { label: 'Under Review', class: 'bg-amber-950/70 text-amber-300 border-amber-500/40' },
      approved: { label: 'Approved', class: 'bg-teal-950/70 text-teal-300 border-teal-500/40' },
      assigned: { label: 'Volunteer Assigned', class: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40' },
      in_progress: { label: 'In Progress', class: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40' },
      completed: { label: 'Completed', class: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' },
      cancelled: { label: 'Cancelled', class: 'bg-rose-950/70 text-rose-300 border-rose-500/40' },
    };

    const s = config[status] || { label: status, class: 'bg-slate-800 text-slate-300' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${s.class}`}>
        {s.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const map: Record<string, string> = {
      low: 'text-slate-400 bg-slate-900 border-slate-800',
      medium: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
      high: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      critical: 'text-red-400 bg-red-950/50 border-red-500/40 animate-pulse',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${map[urgency] || map.medium}`}>
        {urgency} Priority
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
              <HeartHandshake className="w-3.5 h-3.5" />
              Community Assistance Gateway
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              Get Help With Clean Air Protection
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Request air purifiers, DIY system assembly, filter replacements, or protective gear in Mumbai.
            </p>
          </div>

          <button
            onClick={() => setShowWizard(!showWizard)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{showWizard ? 'Close Form' : 'New Assistance Request'}</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* REQUEST CREATION WIZARD */}
        {showWizard && (
          <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
            <h2 className="text-xl font-bold text-white mb-2 font-display">Create Assistance Request</h2>
            <p className="text-xs text-slate-400 mb-6">
              Fill in your details below. Requests are verified and matched with available local volunteers and equipment inventory.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Request Category *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <div
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        category === cat.id
                          ? 'bg-teal-950/40 border-teal-500 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1">{cat.label}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Detailed Explanation of Your Situation *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. My 74-year-old mother has severe COPD and our flat is directly adjacent to high-traffic Western Express Highway in Kurla..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Location & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Mumbai Neighbourhood *
                  </label>
                  <select
                    value={neighbourhood}
                    onChange={e => setNeighbourhood(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {MUMBAI_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Urgency Level *
                  </label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="low">Low (General Inquiry / Planning)</option>
                    <option value="medium">Medium (Within 2-3 Days)</option>
                    <option value="high">High (Urgent Smog Episode)</option>
                    <option value="critical">Critical (Vulnerable Person Distress)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Household Composition
                  </label>
                  <input
                    type="text"
                    value={householdType}
                    onChange={e => setHouseholdType(e.target.value)}
                    placeholder="e.g. 2 adults, 1 toddler"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Existing Equipment & Contact Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Purification Devices Already Available
                  </label>
                  <input
                    type="text"
                    value={existingEquipment}
                    onChange={e => setExistingEquipment(e.target.value)}
                    placeholder="e.g. 1 ceiling fan, no purifier"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Preferred Contact Method
                  </label>
                  <input
                    type="text"
                    value={contactMethod}
                    onChange={e => setContactMethod(e.target.value)}
                    placeholder="e.g. WhatsApp / Phone / In-app message"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentShared}
                  onChange={e => setConsentShared(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-0"
                  required
                />
                <label htmlFor="consent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  I consent to sharing my specified location and contact information with verified SAANS volunteers and community equipment donors for the sole purpose of coordinating this intervention.
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ACTIVE REQUESTS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Community Assistance Requests</h3>
            <span className="text-xs text-slate-400 font-mono">{requests.length} Requests on Record</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
              <Clock className="w-6 h-6 mx-auto animate-spin text-teal-400 mb-2" />
              <p className="text-xs">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
              <HeartHandshake className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No active assistance requests in this view.</p>
              <p className="text-xs text-slate-500 mt-1">Click "New Assistance Request" above to ask for community help.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map(req => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getStatusBadge(req.status)}
                      {getUrgencyBadge(req.urgency)}
                    </div>

                    <h4 className="font-bold text-white text-sm mb-1 capitalize">
                      {req.category.replace('_', ' ')}
                    </h4>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {req.description}
                    </p>

                    <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-teal-400" />
                        <span>{req.location_neighbourhood}, Mumbai</span>
                      </div>
                      {req.creatorName && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Requester: {req.creatorName}</span>
                        </div>
                      )}
                      {req.assignedVolunteerName && (
                        <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          <span>Assigned Volunteer: {req.assignedVolunteerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Requested: {new Date(req.created_at).toLocaleDateString()}</span>
                    <span className="font-mono text-[10px]">ID: #{req.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
