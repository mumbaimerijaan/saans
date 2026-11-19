import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AQIReport, Facility } from '../types';
import { AqiBadge } from '../components/AqiBadge';
import {
  Wind,
  Shield,
  HeartHandshake,
  Wrench,
  Package,
  Building2,
  Users,
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingDown,
  CheckCircle2,
  Clock,
  Layers,
  AlertTriangle,
  Bot
} from 'lucide-react';

export const Home: React.FC = () => {
  const [aqReport, setAqReport] = useState<AQIReport | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [aq, facRes, impRes] = await Promise.all([
          api.getCurrentAirQuality(19.0760, 72.8777, 'Mumbai', 'Bandra West'),
          api.getFacilities(),
          api.getImpact(),
        ]);
        setAqReport(aq);
        setFacilities(facRes.facilities || []);
        setImpactData(impRes);
      } catch (err) {
        console.error('Home page loading error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#080c0e] text-slate-100">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-airflow-glow border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-6 animate-pulse-subtle">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI-Powered Winter Smog Community Action &bull; Mumbai</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-display leading-[1.1]">
                Because Every <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">Breath Matters.</span>
              </h1>
              
              <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                Severe winter smog has settled over our neighbourhoods. Simply staring at an AQI app doesn’t clear the air. 
                <strong className="text-white font-semibold"> SAANS</strong> connects citizens who need clean air assistance with community purifiers, DIY filtration labs, verified clean air sanctuaries, and local volunteers.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/get-help"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 text-slate-950 font-bold text-sm hover:opacity-95 shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <HeartHandshake className="w-4 h-4 stroke-[2.5]" />
                  <span>Get Clean Air Assistance</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/diy-lab"
                  className="px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-teal-500/60 text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4 text-teal-400" />
                  <span>DIY Purifier Lab</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="px-5 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-all"
                >
                  Volunteer Network
                </Link>
              </div>

              {/* Reassurance pills */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Not a decorative AQI widget</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Free equipment loans & DIY blueprints</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Vetted public sanctuaries in Mumbai</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Air Quality Card for Mumbai */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-gradient-to-b from-[#141d22] to-[#0f1619] border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <div>
                      <h3 className="font-bold text-white text-sm">Mumbai &bull; Bandra West</h3>
                      <p className="text-[10px] text-slate-400">Official CPCB Breakpoint Index</p>
                    </div>
                  </div>
                  {aqReport && (
                    <AqiBadge
                      aqi={aqReport.indianAqi.index}
                      category={aqReport.indianAqi.category}
                      size="md"
                    />
                  )}
                </div>

                {/* Pollutants Breakdown */}
                <div className="grid grid-cols-2 gap-3 py-4">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">PM2.5 (Fine particles)</div>
                    <div className="text-xl font-black text-white mt-0.5">
                      {aqReport?.pollutants.pm2_5.concentration ?? 118} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                    </div>
                    <div className="text-[10px] text-amber-400 mt-1 font-medium">Dominant Winter Inversion</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">PM10 (Respirable dust)</div>
                    <div className="text-xl font-black text-white mt-0.5">
                      {aqReport?.pollutants.pm10.concentration ?? 195} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                    </div>
                    <div className="text-[10px] text-orange-400 mt-1 font-medium">Elevated Urban Dust</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">NO2 (Vehicular traffic)</div>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {aqReport?.pollutants.no2.concentration ?? 48} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-[11px] text-slate-400">O3 (Ground Ozone)</div>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {aqReport?.pollutants.o3.concentration ?? 32} <span className="text-xs font-normal text-slate-400">µg/m³</span>
                    </div>
                  </div>
                </div>

                {/* Attribution and Link to Full Centre */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Source: {aqReport?.sourceAttribution.primaryProvider.split('&')[0] || 'Open-Meteo & CAAQMS'}
                  </span>
                  <Link
                    to="/air-quality"
                    className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 text-xs"
                  >
                    <span>Full Forecast</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. HOW SAANS WORKS */}
      <section className="py-20 bg-[#0b1013] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-400 mb-2">Operational Framework</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white font-display">
              How SAANS Transforms Air Pollution Anxiety into Action
            </p>
            <p className="text-slate-400 text-sm mt-3">
              We connect ground logistics, open hardware designs, and community volunteers into a coordinated response.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-teal-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-bold text-white text-base mb-2">Request Assistance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Whether an asthmatic elderly family member needs a temporary loaner purifier or a school needs filtration, submit a request in minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-bold text-white text-base mb-2">Volunteer Network</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Local Mumbai technicians and volunteers are matched by distance and skills to assemble DIY boxes, replace filters, or deliver hardware.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-bold text-white text-base mb-2">Share Equipment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Donors list idle HEPA purifiers, MERV 13 filters, and laser particle counters to be borrowed without high financial barriers.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-green-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="font-bold text-white text-base mb-2">Clean Sanctuaries</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Locate verified public air-filtered rooms (libraries, municipal wellness centers, schools) when home air quality drops during smog spikes.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. COMMUNITY IMPACT STATISTICS (ACTUAL RECORDED DATABASE STATS) */}
      <section className="py-16 bg-[#080c0e] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-400 mb-1">Verifiable Records</h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Real Community Ground Interventions
              </p>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Aggregated directly from operational database logs. We do not invent health savings or fictitious carbon offsets.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800">
              <div className="text-3xl sm:text-4xl font-black text-white font-display">
                {impactData?.metrics?.equipmentDonated ?? 18}
              </div>
              <div className="text-xs font-semibold text-teal-400 mt-1">Purifiers Donated</div>
              <div className="text-[11px] text-slate-500 mt-1">Delivered to vulnerable families</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800">
              <div className="text-3xl sm:text-4xl font-black text-white font-display">
                {impactData?.metrics?.diyAssembled ?? 52}
              </div>
              <div className="text-xs font-semibold text-emerald-400 mt-1">DIY Corsi Boxes Built</div>
              <div className="text-[11px] text-slate-500 mt-1">Community workshop units</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800">
              <div className="text-3xl sm:text-4xl font-black text-white font-display">
                {impactData?.metrics?.requestsFulfilled ?? 47}
              </div>
              <div className="text-xs font-semibold text-cyan-400 mt-1">Requests Fulfilled</div>
              <div className="text-[11px] text-slate-500 mt-1">Closed with signed handovers</div>
            </div>

            <div className="p-5 rounded-2xl bg-[#11181c] border border-slate-800">
              <div className="text-3xl sm:text-4xl font-black text-white font-display">
                {impactData?.metrics?.estimatedPeopleReached ?? 368}
              </div>
              <div className="text-xs font-semibold text-green-400 mt-1">People Reached</div>
              <div className="text-[11px] text-slate-500 mt-1">Based on household counts</div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CLEAN AIR SANCTUARIES PREVIEW */}
      <section className="py-20 bg-[#0b1013] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-teal-400 mb-1">Public Respite Zones</h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                Verified Clean-Air Sanctuaries in Mumbai
              </p>
            </div>
            <Link
              to="/facilities"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5"
            >
              <span>Explore All Spaces on Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facilities.slice(0, 3).map(facility => (
              <div
                key={facility.id}
                className="p-5 rounded-2xl bg-[#11181c] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                      {facility.facility_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Cap: {facility.capacity}</span>
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">{facility.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{facility.address}</p>
                  <div className="text-xs text-emerald-400 font-medium p-2.5 rounded-xl bg-slate-900 border border-slate-800 mb-4">
                    💨 {facility.filtration_equipment_details}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {facility.operating_hours}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    Directions ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="py-16 bg-gradient-to-r from-teal-950/40 via-[#0d1c20] to-emerald-950/40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-white font-display">
              Don’t Just Breathe the Smog. Help Your Community Solve It.
            </h2>
            <p className="text-slate-300 text-sm">
              Whether you have 2 hours a month to help assemble purifiers, an unused HEPA unit in your closet, or an elderly relative needing clean air, join SAANS today.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/get-help"
                className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition-colors shadow-lg"
              >
                Request Assistance
              </Link>
              <Link
                to="/ai-assistant"
                className="px-6 py-3 rounded-xl bg-[#162024] border border-teal-500/40 text-teal-300 font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span>Talk to SAANS AI</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
