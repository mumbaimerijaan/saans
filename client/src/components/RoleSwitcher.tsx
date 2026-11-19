import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ShieldAlert, HeartHandshake, Wrench, User } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, switchRoleQuick, isLoading } = useAuth();

  const roles = [
    { id: 'citizen', label: 'Citizen (Priya)', icon: User, color: 'hover:text-teal-400' },
    { id: 'volunteer', label: 'Volunteer (Rahul)', icon: Wrench, color: 'hover:text-amber-400' },
    { id: 'donor', label: 'Donor (CleanAir NGO)', icon: HeartHandshake, color: 'hover:text-emerald-400' },
    { id: 'admin', label: 'Admin (SAANS Team)', icon: ShieldAlert, color: 'hover:text-rose-400' },
  ] as const;

  return (
    <div className="flex items-center gap-1 bg-[#11181c]/90 border border-slate-800 rounded-full p-1 text-xs shadow-inner">
      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider flex items-center gap-1 border-r border-slate-800 hidden sm:flex">
        <UserCheck className="w-3 h-3 text-teal-400" />
        Role:
      </span>
      {roles.map(r => {
        const isActive = user?.accountType === r.id;
        const Icon = r.icon;
        return (
          <button
            key={r.id}
            onClick={() => switchRoleQuick(r.id)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs font-medium ${
              isActive
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm font-semibold'
                : `text-slate-400 hover:bg-slate-800/80 ${r.color}`
            }`}
            title={`Switch session to ${r.label}`}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden md:inline">{r.label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
};
