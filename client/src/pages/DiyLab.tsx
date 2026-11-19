import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Wrench,
  Calculator,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Bot,
  HelpCircle,
  Fan,
  Sparkles,
  Send,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';

export const DiyLab: React.FC = () => {
  // Room Calculator State
  const [lengthFt, setLengthFt] = useState<number>(15);
  const [widthFt, setWidthFt] = useState<number>(12);
  const [heightFt, setHeightFt] = useState<number>(10);
  const [targetACH, setTargetACH] = useState<number>(5);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Performance Tracking State
  const [preReading, setPreReading] = useState<number>(145);
  const [postReading, setPostReading] = useState<number>(28);
  const [readingLogged, setReadingLogged] = useState(false);

  // AI Assistant Chat State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'calculator' | 'components' | 'assembly' | 'performance'>('calculator');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcLoading(true);
    try {
      const data = await api.calculateDiyCadr(lengthFt, widthFt, heightFt, targetACH);
      setCalcResult(data);
    } catch (err: any) {
      alert(err.message || 'Calculation failed');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.sendAiChat([
        { role: 'user', content: `DIY Air Purifier Question: ${aiQuestion}` }
      ], 'en');
      setAiAnswer(res.content);
    } catch (err: any) {
      alert(err.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-8 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-widest mb-1">
              <Wrench className="w-3.5 h-3.5" />
              Open Hardware Lab
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">
              DIY Air Purifier Lab & Sizing Engine
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Build high-performance, low-cost Corsi-Rosenthal box purifiers with validated airflow and safety instructions.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#11181c] border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'calculator' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              CADR Calculator
            </button>
            <button
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'components' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Components
            </button>
            <button
              onClick={() => setActiveTab('assembly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'assembly' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Assembly Guide
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'performance' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Performance
            </button>
          </div>
        </div>

        {/* TAB 1: ROOM CADR CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Form */}
            <div className="lg:col-span-5 rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-400" />
                Room CADR Sizing Estimator
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Formula: <code className="text-teal-300 font-mono">CADR = Volume × Air Changes Per Hour (ACH) / 60</code>
              </p>

              <form onSubmit={handleCalculate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Room Length (Feet)</label>
                    <input
                      type="number"
                      min={6}
                      max={60}
                      value={lengthFt}
                      onChange={e => setLengthFt(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Room Width (Feet)</label>
                    <input
                      type="number"
                      min={6}
                      max={60}
                      value={widthFt}
                      onChange={e => setWidthFt(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ceiling Height (Feet)</label>
                    <input
                      type="number"
                      min={7}
                      max={20}
                      value={heightFt}
                      onChange={e => setHeightFt(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target ACH (Clean Air Changes)</label>
                    <select
                      value={targetACH}
                      onChange={e => setTargetACH(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value={3}>3 ACH (Moderate Baseline)</option>
                      <option value={5}>5 ACH (Severe Winter Smog Recommended)</option>
                      <option value={6}>6 ACH (Sensitive Asthmatic Inhabitants)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
                  <Info className="w-3.5 h-3.5 text-teal-400 inline mr-1 -mt-0.5" />
                  Total Room Volume: <strong className="text-slate-200 font-mono">{(lengthFt * widthFt * heightFt).toLocaleString()} cu ft</strong> (~{((lengthFt * widthFt * heightFt) * 0.0283).toFixed(1)} m³)
                </div>

                <button
                  type="submit"
                  disabled={calcLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{calcLoading ? 'Calculating...' : 'Calculate Required CADR'}</span>
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                Planning estimate based on engineering mass-balance equations, not a certified medical device guarantee.
              </div>
            </div>

            {/* Sizing Output & Blueprint Recommendations */}
            <div className="lg:col-span-7 space-y-6">
              {calcResult ? (
                <div className="rounded-2xl bg-gradient-to-br from-[#11181c] to-[#162024] border border-teal-500/30 p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs uppercase font-extrabold text-teal-400 tracking-wider">
                      Recommended Hardware Configuration
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      {calcResult.recommendedSystem}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Required CADR</div>
                      <div className="text-2xl font-black text-white font-display mt-0.5">
                        {calcResult.requiredCadrCfm} <span className="text-xs font-normal text-slate-400">CFM</span>
                      </div>
                      <div className="text-[10px] text-teal-400 font-mono mt-0.5">{calcResult.requiredCadrM3h} m³/h</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Filters Needed</div>
                      <div className="text-2xl font-black text-emerald-400 font-display mt-0.5">
                        {calcResult.filterCount}x
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">MERV 13 (20"x20")</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-slate-400">Target Air Clean</div>
                      <div className="text-2xl font-black text-cyan-400 font-display mt-0.5">
                        {targetACH} <span className="text-xs font-normal text-slate-400">ACH</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Every 12 mins</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Fan className="w-4 h-4 text-teal-400" />
                      Fan Specification:
                    </h4>
                    <p className="text-slate-300">{calcResult.fanRecommendation}</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Essential Safety & Fire Protocols
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {calcResult.safetyNotes.map((note: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-12 text-center text-slate-500">
                  <Calculator className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <h3 className="text-sm font-semibold text-slate-300">Room Sizing Blueprint Ready</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Enter your room dimensions on the left and click "Calculate Required CADR" to receive exact fan specifications and filter requirements.
                  </p>
                </div>
              )}

              {/* Ask AI about this setup */}
              <div className="rounded-2xl bg-[#11181c] border border-slate-800 p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-teal-400" />
                  Ask SAANS AI About DIY Purifiers
                </h3>
                <form onSubmit={handleAskAi} className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      placeholder="e.g. Can I use a table fan? How do I reduce motor noise?"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors flex items-center gap-1 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{aiLoading ? 'Thinking...' : 'Ask'}</span>
                    </button>
                  </div>
                </form>

                {aiAnswer && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-teal-500/30 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap animate-in fade-in duration-150">
                    {aiAnswer}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: COMPONENT SELECTOR */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-white font-display mb-1">Compatible Hardware Specifications</h2>
              <p className="text-xs text-slate-400">
                To build an effective Corsi-Rosenthal unit, you must select components that balance high air velocity against low static pressure resistance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                  <Fan className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">1. Box Fan / Axial Fan</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  20-inch (500mm) flat-blade box fan (Orient, Crompton, or Usha). Look for 3-speed selector with thermal overload fuse protection.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-teal-300">
                  ✓ Minimum 1,200 CFM free-air rating
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">2. Air Filters (MERV 13 / HEPA)</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Four 20"x20"x1" or 20"x20"x2" pleated HVAC furnace filters rated MERV 13 (or HEPA H11). Lower MERV ratings (e.g. MERV 8) will not filter fine PM2.5 smog particles.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-300">
                  ✓ Minimum 85% capture of 0.3 - 1.0 µm particles
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base">3. Sealing Materials & Shroud</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Heavy-duty duct tape or Gorilla tape, a cardboard base (20"x20"), and a circular cardboard shroud taped onto the fan face to eliminate corner backdrafts.
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300">
                  ✓ Eliminates corner vortex leaks by 40%
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: STEP-BY-STEP ASSEMBLY GUIDE */}
        {activeTab === 'assembly' && (
          <div className="space-y-6">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-white font-display mb-1">Step-by-Step Construction Guide</h2>
              <p className="text-xs text-slate-400">
                Follow this sequence to assemble a 4-filter Corsi-Rosenthal cube in under 45 minutes.
              </p>
            </div>

            <div className="space-y-4">
              
              <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">Filter Direction Check</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Examine each of the four MERV 13 filters for the printed <strong>Airflow Arrow (&rarr;)</strong>. Arrange the four filters into a four-sided square box, ensuring every arrow points <strong>INWARD</strong> toward the center of the box.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">Corner Taping</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Join the four vertical corners with long strips of duct tape. Rub down the tape firmly to ensure no pinhole air leaks. The 4 filters should stand up as a rigid square column.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">Bottom Base Installation</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Cut a piece of clean cardboard to 20"x20". Place it under the four-filter square to form the bottom seal. Tape all four bottom edges airtight with duct tape.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">Fan Placement & Top Seal</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Place the 20-inch box fan on top of the cube with the airflow blowing <strong>UPWARD (OUTWARD)</strong>. Ensure the power cord exits cleanly from a corner without being pinched. Tape the perimeter of the fan to the filter edges.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  5
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-white text-sm">Cardboard Shroud Attachment</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Cut a circular opening in a piece of cardboard matching the diameter of the fan blades (~16-17 inches). Tape this shroud onto the fan grill. This prevents air from recirculating backwards into the fan blade tips.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: PERFORMANCE TRACKING */}
        {activeTab === 'performance' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white font-display mb-1">Particulate Reduction Logging</h2>
              <p className="text-xs text-slate-400">
                Record your before-and-after PM2.5 readings when running a DIY purifier in a closed room.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Baseline PM2.5 (Before Purifier, µg/m³)</label>
                  <input
                    type="number"
                    value={preReading}
                    onChange={e => setPreReading(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">PM2.5 After 45 Mins Run (µg/m³)</label>
                  <input
                    type="number"
                    value={postReading}
                    onChange={e => setPostReading(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Calculated Reduction */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Measured Particle Reduction</div>
                  <div className="text-2xl font-black text-emerald-400 font-display mt-0.5">
                    {preReading > 0 ? Math.round(((preReading - postReading) / preReading) * 100) : 0}% Drop
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReadingLogged(true);
                    setTimeout(() => setReadingLogged(false), 3000);
                  }}
                  className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
                >
                  {readingLogged ? 'Logged to Community Data!' : 'Log Verified Telemetry'}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Note: Readings require a laser-scattering particle counter (e.g. Plantower, Temtop, Sensirion). Do not enter visual estimates as verified measurements.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
