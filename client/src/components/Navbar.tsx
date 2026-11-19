import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { RoleSwitcher } from './RoleSwitcher';
import {
  Wind,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Activity,
  HeartHandshake,
  Package,
  Wrench,
  Building2,
  AlertTriangle,
  Bot,
  LayoutDashboard,
  Server,
  User,
  LogOut
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/air-quality', label: 'Air Quality', icon: Activity },
    { path: '/get-help', label: 'Get Help', icon: HeartHandshake },
    { path: '/equipment', label: 'Equipment', icon: Package },
    { path: '/diy-lab', label: 'DIY Lab', icon: Wrench },
    { path: '/facilities', label: 'Clean Sanctuaries', icon: Building2 },
    { path: '/community-reports', label: 'Pollution Reports', icon: AlertTriangle },
    { path: '/ai-assistant', label: 'SAANS AI', icon: Bot, highlight: true },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/system-status', label: 'Status', icon: Server },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c0e]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform">
              <Wind className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white font-display">SAANS</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Mumbai
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block tracking-wide">
                Because every breath matters.
              </p>
            </div>
          </Link>

          {/* Role Switcher Pill (Quick perspective toggle for evaluator) */}
          <div className="hidden lg:flex items-center">
            <RoleSwitcher />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            {navLinks.map(link => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? 'bg-slate-800 text-teal-400 font-semibold'
                      : link.highlight
                      ? 'bg-gradient-to-r from-teal-500/15 to-emerald-500/15 text-teal-300 border border-teal-500/30 hover:border-teal-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${link.highlight ? 'text-teal-400' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls: Notifications, Theme, User */}
          <div className="flex items-center gap-2">
            
            {/* Notification Bell */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="View in-app notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors hidden sm:block"
              title="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-teal-400" />}
            </button>

            {/* User Profile / Status */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                  title="Go to dashboard"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-xs font-bold uppercase">
                    {(user.fullName || (user as any).full_name || user.email || 'U').charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">
                    {(user.fullName || (user as any).full_name || user.email || 'User').split(' ')[0]}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors hidden sm:block"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-semibold hover:opacity-95 shadow-md"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 xl:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#11181c] border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <div className="py-2 border-b border-slate-800">
            <RoleSwitcher />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(link => {
              const active = isActive(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${
                    active
                      ? 'bg-slate-800 text-teal-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-teal-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
