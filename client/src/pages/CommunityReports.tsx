import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CommunityReport } from '../types';
import { InteractiveMap } from '../components/InteractiveMap';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  PlusCircle,
  Clock,
  MapPin,
  Camera,
  ShieldCheck,
  Send,
  CheckCircle2,
  Filter,
  EyeOff
} from 'lucide-react';

const CATEGORIES = [
  { id: 'garbage_burning', label: 'Waste / Garbage Burning' },
  { id: 'construction_dust', label: 'Uncovered Construction Dust' },
  { id: 'industrial_smoke', label: 'Industrial Smoke Emission' },
  { id: 'roadside_burning', label: 'Roadside Debris / Leaf Burning' },
  { id: 'excessive_dust', label: 'Heavy Vehicle Resuspended Dust' },
  { id: 'other', label: 'Other Pollution Incident' },
];

const MUMBAI_AREAS = [
  { name: 'Kurla West', lat: 19.0680, lon: 72.8810 },
  { name: 'Andheri East', lat: 19.1120, lon: 72.8680 },
  { name: 'Bandra West', lat: 19.0558, lon: 72.8300 },
  { name: 'Dadar', lat: 19.0195, lon: 72.8428 },
  { name: 'Chembur', lat: 19.0622, lon: 72.8992 },
  { name: 'Thane West', lat: 19.2183, lon: 72.9781 },
];

export const CommunityReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [category, setCategory] = useState<'garbage_burning' | 'construction_dust' | 'industrial_smoke' | 'roadside_burning' | 'excessive_dust' | 'other'>('garbage_burning');
  const [description, setDescription] = useState('');
  const [neighbourhood, setNeighbourhood] = useState(MUMBAI_AREAS[0].name);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    try {
      const res = await api.getReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const area = MUMBAI_AREAS.find(a => a.name === neighbourhood) || MUMBAI_AREAS[0];
      await api.submitReport({
        category,
        description,
        city: 'Mumbai',
        neighbourhood: area.name,
        latitude: area.lat,
        longitude: area.lon,
        imageUrl: imageUrl || undefined
      });
      alert('Pollution report submitted successfully. It will be verified by community moderators before appearing publicly.');
      setShowModal(false);
      setDescription('');
      setImageUrl('');
      await loadReports();
    } catch (err: any) {
      alert(err.message || 'Report submission failed');
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
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Community Environmental Watch
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              Pollution Incident Reporting
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Flag unauthorized waste burning, unshielded construction dust, and industrial smoke across Mumbai.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Report a Pollution Incident</span>
          </button>
        </div>

        {/* MAP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider">Incident Geolocation Map</span>
            <span className="text-slate-500 flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" />
              User identities strictly protected
            </span>
          </div>
          <InteractiveMap
            reports={reports}
            center={[19.0760, 72.8777]}
            zoom={12}
            height="380px"
          />
        </div>

        {/* REPORTS LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Verified Community Incidents ({reports.length})</h3>
            <span className="text-xs text-slate-400">Moderated for accuracy</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
              <Clock className="w-6 h-6 mx-auto animate-spin text-teal-400 mb-2" />
              <p className="text-xs">Loading incident reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
              <p className="text-sm font-semibold text-slate-300">No unverified pollution spikes reported right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map(r => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-[#11181c] border border-slate-800 hover:border-slate-700 overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {r.imageUrl && (
                      <div className="h-44 w-full bg-slate-900 relative">
                        <img
                          src={r.imageUrl}
                          alt={r.category}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                            {r.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.status === 'verified'
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                              : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {!r.imageUrl && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {r.category.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Status: {r.status}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        "{r.description}"
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-teal-400" />
                        <span>{r.neighbourhood}, Mumbai</span>
                      </div>

                      {r.resolutionNotes && (
                        <div className="p-3 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs text-teal-300">
                          <strong>Civic Resolution:</strong> {r.resolutionNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 pt-0 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 mt-3 pt-3">
                    <span>Reported: {new Date(r.createdAt || (r as any).created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="font-mono text-[10px]">ID: #{r.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REPORT SUBMISSION MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="w-full max-w-lg bg-[#11181c] border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h3 id="modal-title" className="text-xl font-bold text-white mb-1 font-display">
                Report Pollution Event
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Protect your community by reporting localized emission sources. Identities are kept strictly private.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="report-category" className="block text-slate-300 font-bold mb-1">Incident Category *</label>
                  <select
                    id="report-category"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="report-neighbourhood" className="block text-slate-300 font-bold mb-1">Location / Neighbourhood *</label>
                  <select
                    id="report-neighbourhood"
                    value={neighbourhood}
                    onChange={e => setNeighbourhood(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {MUMBAI_AREAS.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="report-description" className="block text-slate-300 font-bold mb-1">Observation Description *</label>
                  <textarea
                    id="report-description"
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the visible smoke, smell, or dust cloud, proximity to residential apartments, and time of day..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="report-image-url" className="block text-slate-300 font-bold mb-1">Evidence Photo URL (Optional)</label>
                  <input
                    id="report-image-url"
                    type="url"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    aria-label="Submit community pollution incident report"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Incident'}</span>
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
