import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Equipment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  Send,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'hepa_purifier', label: 'HEPA Purifiers' },
  { id: 'diy_filtration', label: 'DIY Corsi Systems' },
  { id: 'replacement_filter', label: 'Replacement Filters' },
  { id: 'fan_component', label: 'Fans & Motors' },
  { id: 'iaq_monitor', label: 'IAQ Sensors & Monitors' },
  { id: 'protective_gear', label: 'Protective Respirators' },
];

export const EquipmentLibrary: React.FC = () => {
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Request Modal State
  const [requestingItem, setRequestingItem] = useState<Equipment | null>(null);
  const [requestPurpose, setRequestPurpose] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('hepa_purifier');
  const [newDesc, setNewDesc] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCondition, setNewCondition] = useState<'new' | 'like_new' | 'good' | 'fair'>('like_new');
  const [newType, setNewType] = useState<'donation' | 'loan'>('loan');
  const [newDuration, setNewDuration] = useState(30);
  const [newNeighbourhood, setNewNeighbourhood] = useState('Andheri East');
  const [newCadr, setNewCadr] = useState<number | undefined>(300);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  const loadEquipment = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedType) params.type = selectedType;
      if (search) params.search = search;
      const res = await api.getEquipment(params);
      setEquipment(res.equipment || []);
    } catch (err) {
      console.error('Error loading equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, [selectedCategory, selectedType, search]);

  const filteredEquipment = equipment.filter(item => {
    if (selectedType && item.type !== selectedType) return false;
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchModel = item.manufacturer_model?.toLowerCase().includes(q);
      const matchLoc = item.location_neighbourhood?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchModel && !matchLoc) return false;
    }
    return true;
  });

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestingItem) return;
    setSubmittingRequest(true);
    try {
      await api.requestEquipment(requestingItem.id, requestPurpose, durationDays);
      alert(`Request submitted for ${requestingItem.name}! The donor/admin has been notified.`);
      setRequestingItem(null);
      setRequestPurpose('');
      await loadEquipment();
      await refreshNotifications();
    } catch (err: any) {
      alert(err.message || 'Failed to submit equipment request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmittingAdd(true);
    try {
      await api.addEquipment({
        name: newName,
        category: newCategory,
        description: newDesc,
        manufacturerModel: newModel,
        condition: newCondition,
        type: newType,
        maxLoanDurationDays: newDuration,
        locationCity: 'Mumbai',
        locationNeighbourhood: newNeighbourhood,
        cadrRating: newCadr
      });
      alert('Equipment listed successfully in the SAANS Community Library!');
      setShowAddModal(false);
      setNewName('');
      setNewDesc('');
      await loadEquipment();
    } catch (err: any) {
      alert(err.message || 'Failed to list equipment');
    } finally {
      setSubmittingAdd(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Title & Add Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
              <Package className="w-3.5 h-3.5" />
              Circular Community Equipment Library
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              Air Purifiers, Filters & Monitoring Gear
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Borrow or receive donated clean air devices across Mumbai without high commercial markups.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>List Equipment for Donation / Loan</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl bg-[#11181c] border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              aria-label="Search equipment by model, brand, or specifications"
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by model, brand, or specs..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <select
            value={selectedCategory}
            aria-label="Filter equipment by device category"
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={selectedType}
            aria-label="Filter equipment by loan or donation status"
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Types (Loans & Donations)</option>
            <option value="loan">Temporary Loan</option>
            <option value="donation">Permanent Donation</option>
          </select>

          {(selectedCategory || selectedType || search) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedType('');
                setSearch('');
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Equipment Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
            <Clock className="w-6 h-6 mx-auto animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading equipment inventory...</p>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-[#11181c] rounded-2xl border border-slate-800">
            <Package className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-300">No equipment items found matching your filters.</p>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search or list a new item above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipment.map(item => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#11181c] border border-slate-800 hover:border-slate-700 overflow-hidden shadow-xl flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Image banner */}
                  <div className="h-44 w-full bg-slate-900 relative overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'donation'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-teal-500 text-slate-950 font-black'
                      }`}>
                        {item.type === 'donation' ? 'Permanent Donation' : `Loan (${item.max_loan_duration_days} Days)`}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        item.status === 'available'
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                          : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-[11px] text-teal-400 font-medium uppercase tracking-wider">
                        {item.category.replace('_', ' ')}
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">{item.name}</h3>
                      {item.manufacturer_model && (
                        <p className="text-xs text-slate-400 font-mono">{item.manufacturer_model}</p>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                      <div>
                        Condition: <strong className="text-slate-200 capitalize">{item.condition.replace('_', ' ')}</strong>
                      </div>
                      {item.cadr_rating && (
                        <div>
                          CADR: <strong className="text-emerald-400 font-bold">{item.cadr_rating} m³/h</strong>
                        </div>
                      )}
                      <div className="col-span-2 flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3 h-3 text-teal-400" />
                        <span>{item.location_neighbourhood}, Mumbai</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => setRequestingItem(item)}
                    disabled={item.status !== 'available'}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      item.status === 'available'
                        ? 'bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-200 shadow-md'
                        : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <span>{item.status === 'available' ? 'Request This Equipment' : `Currently ${item.status}`}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REQUEST MODAL */}
        {requestingItem && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-[#11181c] border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <h3 className="text-lg font-bold text-white mb-1 font-display">
                Request "{requestingItem.name}"
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Location: {requestingItem.location_neighbourhood} &bull; Type: {requestingItem.type.toUpperCase()}
              </p>

              <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    State Purpose of Request (e.g. vulnerable child with wheezing) *
                  </label>
                  <textarea
                    rows={3}
                    value={requestPurpose}
                    onChange={e => setRequestPurpose(e.target.value)}
                    placeholder="Describe why you need this equipment and current indoor conditions..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                {requestingItem.type === 'loan' && (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Requested Loan Duration (Days) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={requestingItem.max_loan_duration_days || 30}
                      value={durationDays}
                      onChange={e => setDurationDays(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRequestingItem(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingRequest ? 'Sending...' : 'Confirm Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD EQUIPMENT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-[#11181c] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-white mb-1 font-display">
                List Equipment in SAANS Library
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Share an air purifier, DIY box unit, or particulate monitor with community members.
              </p>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Equipment Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Mi Air Purifier 3H HEPA"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Category *</label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="hepa_purifier">HEPA Purifier</option>
                      <option value="diy_filtration">DIY Corsi System</option>
                      <option value="replacement_filter">Replacement Filter</option>
                      <option value="iaq_monitor">IAQ Monitor</option>
                      <option value="protective_gear">Protective Masks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Condition *</label>
                    <select
                      value={newCondition}
                      onChange={e => setNewCondition(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="new">Brand New</option>
                      <option value="like_new">Like New</option>
                      <option value="good">Good Working Condition</option>
                      <option value="fair">Fair (Minor cosmetic wear)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Type *</label>
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="loan">Temporary Community Loan</option>
                      <option value="donation">Permanent Donation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Neighbourhood *</label>
                    <input
                      type="text"
                      value={newNeighbourhood}
                      onChange={e => setNewNeighbourhood(e.target.value)}
                      placeholder="e.g. Dadar, Kurla, Bandra"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Description & Maintenance Details *</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Include filter age, coverage area, and any special instructions..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors shadow-md flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>{submittingAdd ? 'Saving...' : 'List in Library'}</span>
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
