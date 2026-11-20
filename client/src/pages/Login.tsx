import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wind, Lock, Mail, ArrowRight, UserCheck, ShieldCheck, HeartHandshake, Wrench, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, switchRoleQuick, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: 'citizen' | 'volunteer' | 'donor' | 'admin') => {
    try {
      await switchRoleQuick(role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c0e] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-[#11181c] border border-slate-800 p-8 rounded-2xl shadow-2xl">
        
        {/* Brand */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold mx-auto mb-3 shadow-lg">
            <Wind className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white font-display">Sign In to SAANS</h2>
          <p className="text-xs text-slate-400 mt-1">Because every breath matters &bull; Mumbai Clean Air Platform</p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Standard Email Login */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="login-email" className="block text-slate-300 font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-slate-300 font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-label="Sign in to your SAANS account"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold text-xs hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Evaluation Accounts */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 text-center flex items-center justify-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            1-Click Demo Evaluation Sign In
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin('citizen')}
              disabled={isLoading}
              aria-label="Sign in as Citizen demo persona Priya Sharma"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-left transition-colors flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-teal-400" />
              <div>
                <div className="font-bold text-slate-200">Citizen</div>
                <div className="text-[10px] text-slate-500">Priya (Kurla)</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickLogin('volunteer')}
              disabled={isLoading}
              aria-label="Sign in as Volunteer demo persona Rahul Deshmukh"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-colors flex items-center gap-2"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <div className="font-bold text-slate-200">Volunteer</div>
                <div className="text-[10px] text-slate-500">Rahul (Dadar)</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickLogin('donor')}
              disabled={isLoading}
              aria-label="Sign in as Donor NGO demo persona CleanAir Mumbai"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors flex items-center gap-2"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <div className="font-bold text-slate-200">Donor NGO</div>
                <div className="text-[10px] text-slate-500">CleanAir Mumbai</div>
              </div>
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              disabled={isLoading}
              aria-label="Sign in as Administrator demo persona Admin SAANS"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-left transition-colors flex items-center gap-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <div>
                <div className="font-bold text-slate-200">Administrator</div>
                <div className="text-[10px] text-slate-500">Admin SAANS</div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-teal-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};
