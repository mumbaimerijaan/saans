import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Shield, Heart, MapPin, ExternalLink, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#06090a] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold">
                <Wind className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-lg text-white font-display">SAANS</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Because every breath matters. An AI-powered community movement designed to protect urban families from severe winter smog through actionable interventions, shared equipment, and volunteer support.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>Initial Focus: Mumbai Metropolitan Region</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Community Solutions</h4>
            <ul className="space-y-2">
              <li><Link to="/air-quality" className="hover:text-teal-400 transition-colors">Air Quality Centre (CPCB AQI)</Link></li>
              <li><Link to="/get-help" className="hover:text-teal-400 transition-colors">Assistance Requests Wizard</Link></li>
              <li><Link to="/equipment" className="hover:text-teal-400 transition-colors">Clean Air Equipment Library</Link></li>
              <li><Link to="/diy-lab" className="hover:text-teal-400 transition-colors">DIY Purifier Lab & CADR</Link></li>
              <li><Link to="/facilities" className="hover:text-teal-400 transition-colors">Clean Air Sanctuaries Directory</Link></li>
              <li><Link to="/community-reports" className="hover:text-teal-400 transition-colors">Pollution Incident Reports</Link></li>
            </ul>
          </div>

          {/* AI & Intelligence */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">AI & Environmental Science</h4>
            <ul className="space-y-2">
              <li><Link to="/ai-assistant" className="hover:text-teal-400 transition-colors flex items-center gap-1">SAANS GenAI Assistant <Sparkles className="w-3 h-3 text-teal-400" /></Link></li>
              <li><Link to="/system-status" className="hover:text-teal-400 transition-colors">Live Integration Health</Link></li>
              <li><a href="https://cpcb.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors flex items-center gap-1">CPCB National AQI Standards <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors flex items-center gap-1">Open-Meteo CAMS Model <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href="https://openaq.org" target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 transition-colors flex items-center gap-1">OpenAQ Sensor Network <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>

          {/* Ethics & Transparency */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Safety & Data Policy</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              SAANS does not fabricate statistics or make medical claims. All advice follows vetted environmental engineering principles and CPCB guidelines.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              Virtual PromptWars Challenge 06 &bull; Urban Clean Air Platform
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} SAANS Community Movement. Open-source clean air infrastructure.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-teal-400/80">English &bull; हिन्दी &bull; मराठी</span>
            <span>&bull;</span>
            <Link to="/system-status" className="hover:text-slate-300">System Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
