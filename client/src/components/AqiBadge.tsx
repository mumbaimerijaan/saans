import React from 'react';

interface AqiBadgeProps {
  aqi: number | null;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  showCategory?: boolean;
}

export const AqiBadge: React.FC<AqiBadgeProps> = ({ aqi, category, size = 'md', showCategory = true }) => {
  if (aqi === null || aqi === undefined) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
        AQI N/A
      </span>
    );
  }

  // CPCB Official Breakpoint colors
  let bgClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
  let dotClass = 'bg-emerald-400';
  let catText = category || 'Good';

  if (aqi <= 50) {
    bgClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    dotClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
    catText = 'Good';
  } else if (aqi <= 100) {
    bgClass = 'bg-teal-950/80 text-teal-300 border-teal-500/40';
    dotClass = 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]';
    catText = 'Satisfactory';
  } else if (aqi <= 200) {
    bgClass = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
    dotClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
    catText = 'Moderate';
  } else if (aqi <= 300) {
    bgClass = 'bg-orange-950/80 text-orange-300 border-orange-500/40';
    dotClass = 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]';
    catText = 'Poor';
  } else if (aqi <= 400) {
    bgClass = 'bg-red-950/90 text-red-200 border-red-500/50';
    dotClass = 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)]';
    catText = 'Very Poor';
  } else {
    bgClass = 'bg-purple-950/90 text-purple-200 border-purple-500/50';
    dotClass = 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.9)]';
    catText = 'Severe';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold',
    md: 'text-sm px-3 py-1 font-bold',
    lg: 'text-base px-4 py-2 font-black tracking-wide'
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border ${bgClass} ${sizeClasses[size]} transition-all`}>
      <span className={`w-2.5 h-2.5 rounded-full ${dotClass} animate-pulse-subtle`}></span>
      <span>{aqi}</span>
      {showCategory && <span className="text-xs font-medium uppercase tracking-wider opacity-90 border-l border-current/20 pl-1.5">{catText}</span>}
    </span>
  );
};
