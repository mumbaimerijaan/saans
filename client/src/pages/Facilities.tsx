import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Facility } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Send,
  Navigation,
  ExternalLink
} from 'lucide-react';

const FACILITY_TYPES = [
  { id: '', label: 'All Facility Types' },
  { id: 'library', label: 'Public Libraries' },
  { id: 'community_hall', label: 'Community Halls' },
  { id: 'clinic', label: 'Health Clinics & Respite' },
  { id: 'school', label: 'Schools & Learning Hubs' },
  { id: 'housing_society', label: 'Housing Societies' },
  { id: 'ngo_centre', label: 'NGO Community Centers' },
];

export const Facilities: React.FC = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Submit Facility Recommendation Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [name, setName] = useState('');
  const [facilityType, setFacilityType] = useState<'library' | 'community_hall' | 'school' | 'clinic' | 'housing_society' | 'ngo_centre'>('library');
  const [address, setAddress] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('Bandra West');
  const [filtrationDetails, setFiltrationDetails] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [operatingHours, setOperatingHours] = useState('09:00 AM - 07:00 PM');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadFacilities = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedType) params.type = selectedType;
      if (search) params.neighbourhood = search;
      const res = await api.getFacilities(params);
      setFacilities(res.facilities || []);
    } catch (err) {
      console.error('Error loading facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [selectedType, search]);

  const filteredFacilities = facilities.filter(item => {
    if (selectedType) {
      const itemType = (item.facility_type || (item as any).facilityType || '').toLowerCase();
      if (itemType !== selectedType.toLowerCase()) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchNeighbourhood = item.neighbourhood?.toLowerCase().includes(q);
      const matchAddress = item.address?.toLowerCase().includes(q);
      if (!matchName && !matchNeighbourhood && !matchAddress) return false;
    }
    return true;
  });

  const handleSubmitFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !filtrationDetails.trim()) return;
    setSubmitting(true);
    try {
      // Default approximate coordinates for Mumbai neighbourhoods
      const coordsMap: Record<string, [number, number]> = {
        'Bandra West': [19.0558, 72.8300],
        'Kurla West': [19.0657, 72.8794],
        'Dadar': [19.0195, 72.8428],
        'Andheri East': [19.1158, 72.8654],
        'Chembur': [19.0622, 72.8992],
        'Worli': [19.0166, 72.8166],
      };
      const [lat, lon] = coordsMap[neighbourhood] || [19.0760, 72.8777];

      await api.submitFacility({
        name,
        facilityType,
        address,
        city: 'Mumbai',
        neighbourhood,
        latitude: lat,
        longitude: lon,
        filtrationEquipmentDetails: filtrationDetails,
        capacity,
        operatingHours,
        contactPhone,
        accessibilityFeatures: ['wheelchair_accessible', 'drinking_water', 'restrooms']
      });

      alert('Facility recommendation submitted! Once verified by our field team, it will be highlighted on the live sanctuary map.');
      setShowSubmitModal(false);
      setName('');
      setAddress('');
      setFiltrationDetails('');
      await loadFacilities();
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
              <Building2 className="w-3.5 h-3.5" />
              Public Respite Directory
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              Clean-Air Sanctuaries in Mumbai
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Audited public spaces equipped with certified HEPA or high-capacity DIY air filtration for community respite during smog peaks.
            </p>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Recommend a Clean Air Facility</span>
          </button>
        </div>

        {/* MAP COMPONENT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider">Sanctuaries Geolocation Overview</span>
            <span className="text-teal-400 font-medium">Click any pin for directions & specs</span>
          </div>
          <InteractiveMap
            facilities={filteredFacilities}
            center={[19.0760, 72.8777]}
            zoom={12}
            height="380px"
          />
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-[#11181c] border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              aria-label="Filter clean air sanctuaries by neighbourhood"
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by neighbourhood (e.g. Bandra, Dadar, Chembur)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <select
            value={selectedType}
            aria-label="Filter clean air sanctuaries by facility type"
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {FACILITY_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {(search || selectedType) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedType('');
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
            <Clock className="w-6 h-6 mx-auto animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading clean air spaces...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
            <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No facilities found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredFacilities.map(facility => (
              <div
                key={facility.id}
                className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      {facility.facility_type.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      Audited Sanctuary
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 font-display">{facility.name}</h3>
                  <p className="text-xs text-slate-300 mb-4">{facility.address}</p>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mb-4 text-xs">
                    <div className="text-teal-400 font-medium">
                      💨 Filtration: <strong className="text-slate-200">{facility.filtration_equipment_details}</strong>
                    </div>
                    <div className="text-slate-400">
                      Capacity: <strong className="text-white">{facility.capacity} citizens</strong> simultaneously
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {facility.accessibility_features.map((feat, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        ✓ {feat.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{facility.operating_hours}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Directions ↗</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SUBMIT RECOMMENDATION MODAL */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-[#11181c] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-1 font-display">
                Recommend Clean-Air Sanctuary
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Submit an indoor space with air purification equipment for community verification.
              </p>

              <form onSubmit={handleSubmitFacility} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Facility Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Bandra Senior Citizens Reading Hall"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Facility Type *</label>
                    <select
                      value={facilityType}
                      onChange={e => setFacilityType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="library">Library</option>
                      <option value="community_hall">Community Hall</option>
                      <option value="school">School / College Room</option>
                      <option value="clinic">Clinic / Wellness Center</option>
                      <option value="housing_society">Housing Society Clubhouse</option>
                      <option value="ngo_centre">NGO Learning Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Neighbourhood *</label>
                    <select
                      value={neighbourhood}
                      onChange={e => setNeighbourhood(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Bandra West">Bandra West</option>
                      <option value="Kurla West">Kurla West</option>
                      <option value="Dadar">Dadar</option>
                      <option value="Andheri East">Andheri East</option>
                      <option value="Chembur">Chembur</option>
                      <option value="Worli">Worli</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Full street address and landmark"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Filtration Equipment Installed *</label>
                  <textarea
                    rows={2}
                    value={filtrationDetails}
                    onChange={e => setFiltrationDetails(e.target.value)}
                    placeholder="e.g. 2x Blueair HealthProtect HEPA units + sealed double-glazed windows"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={e => setCapacity(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Operating Hours</label>
                    <input
                      type="text"
                      value={operatingHours}
                      onChange={e => setOperatingHours(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
