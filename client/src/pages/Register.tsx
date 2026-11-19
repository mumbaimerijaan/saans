import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wind, ArrowRight, UserCheck, ShieldCheck, HeartHandshake, Wrench, User } from 'lucide-react';

const MUMBAI_AREAS = [
  'Bandra West', 'Kurla West', 'Dadar', 'Andheri East',
  'Chembur', 'Worli', 'Colaba', 'Malad', 'Ghatkopar', 'Thane West'
];

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Account credentials & Role
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [neighbourhood, setNeighbourhood] = useState(MUMBAI_AREAS[0]);
  const [accountType, setAccountType] = useState<'citizen' | 'volunteer' | 'donor' | 'admin'>(
    (searchParams.get('role') as any) || 'citizen'
  );
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  // Step 2: Household Profile (Optional)
  const [memberCount, setMemberCount] = useState(4);
  const [elderlyPresent, setElderlyPresent] = useState(false);
  const [childrenPresent, setChildrenPresent] = useState(false);
  const [sensitivePersons, setSensitivePersons] = useState(false);
  const [housingType, setHousingType] = useState('Apartment');
  const [roomSizeSqft, setRoomSizeSqft] = useState(250);
  const [existingPurifiers, setExistingPurifiers] = useState('None');

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleFinalSubmit = async (includeHousehold: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        fullName,
        email,
        password,
        phone: phone || undefined,
        city: 'Mumbai',
        neighbourhood,
        preferredLanguage,
        accountType,
      };

      if (includeHousehold) {
        payload.household = {
          memberCount,
          elderlyPresent,
          childrenPresent,
          sensitivePersons,
          housingType,
          roomSizeSqft,
          existingPurifiers
        };
      }

      await register(payload);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full bg-[#11181c] border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        
        {/* Brand */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold mx-auto mb-3 shadow-lg">
            <Wind className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white font-display">Join the SAANS Movement</h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 ? 'Step 1: Your Profile & Role' : 'Step 2: Household Clean-Air Profile (Optional)'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Vikram Joshi"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vikram@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98200 XXXXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Mumbai Neighbourhood *</label>
                <select
                  value={neighbourhood}
                  onChange={e => setNeighbourhood(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {MUMBAI_AREAS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Role Selection */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Primary Platform Role *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'citizen', label: 'Citizen', desc: 'Need clean air assistance' },
                  { id: 'volunteer', label: 'Volunteer', desc: 'Help install & build' },
                  { id: 'donor', label: 'Donor / Org', desc: 'Share gear & funds' },
                  { id: 'admin', label: 'Admin', desc: 'Coordinate community' },
                ].map(r => (
                  <div
                    key={r.id}
                    onClick={() => setAccountType(r.id as any)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                      accountType === r.id
                        ? 'bg-teal-950/60 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{r.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-slate-300 font-bold mb-1">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={e => setPreferredLanguage(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Continue to Household Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* STEP 2: Optional Household Profile */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400 text-xs">
              This optional data helps SAANS size recommended CADR air purifiers and prioritize assistance during emergency winter smog episodes.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Total Household Members</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={memberCount}
                  onChange={e => setMemberCount(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Approx Room Size (Sq Ft)</label>
                <input
                  type="number"
                  value={roomSizeFt(roomSizeSqft)}
                  onChange={e => setRoomSizeSqft(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={elderlyPresent}
                  onChange={e => setElderlyPresent(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-0"
                />
                <span>Elderly family members (60+ yrs) present</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={childrenPresent}
                  onChange={e => setChildrenPresent(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-0"
                />
                <span>Young children or infants present</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={sensitivePersons}
                  onChange={e => setSensitivePersons(e.target.checked)}
                  className="rounded border-slate-700 text-teal-500 focus:ring-0"
                />
                <span>Individuals with diagnosed asthma, bronchitis, or respiratory sensitivity</span>
              </label>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Existing Air Purification Equipment</label>
              <input
                type="text"
                value={existingPurifiers}
                onChange={e => setExistingPurifiers(e.target.value)}
                placeholder="e.g. None, or 1 bedroom purifier"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="text-xs text-slate-400 hover:text-white"
              >
                Skip This Step
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(true)}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold hover:opacity-95 transition-all shadow-md"
                >
                  {submitting ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Already registered?{' '}
          <Link to="/login" className="text-teal-400 font-semibold hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

function roomSizeFt(val: number) {
  return isNaN(val) ? 200 : val;
}
