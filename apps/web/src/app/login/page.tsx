'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Lock, LogIn, AlertCircle, Sparkles, Shield, UserCheck, Wrench } from 'lucide-react';

const DEMO_PRESETS = [
  {
    label: 'Resident',
    email: 'resident.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'RESIDENT',
    icon: UserCheck,
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    label: 'Staff Reviewer',
    email: 'staff.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'BARANGAY_STAFF',
    icon: Shield,
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    label: 'Barangay Admin',
    email: 'admin.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'BARANGAY_ADMIN',
    icon: Shield,
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    label: 'Maintainer',
    email: 'maintainer.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'SYSTEM_MAINTAINER',
    icon: Wrench,
    badgeColor: 'bg-slate-100 text-slate-800',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ email, password });
      // Redirect based on role
      router.push('/resident');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto my-6 space-y-6">
      {/* Login Card */}
      <div className="bg-white rounded-2xl border border-civic-border p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-50 text-civic-forest rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-civic-slate tracking-tight">
            Sign In to SABTRACK
          </h2>
          <p className="text-xs text-slate-500">
            Barangay Sabang Solid Waste Management Platform
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Account Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. resident.demo@sabtrack.local"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-civic-emerald focus:border-civic-emerald outline-none transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-civic-emerald focus:border-civic-emerald outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover focus:ring-2 focus:ring-emerald-500 outline-none transition-colors disabled:opacity-50"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Development Quick Role Switcher */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-civic-slate">
          <Sparkles className="w-4 h-4 text-civic-emerald" />
          <span>Evaluation Demo Accounts</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Click any role below to pre-populate credentials for Phase 2 RBAC verification. Ensure the database was seeded via <code className="bg-slate-200 px-1 rounded">.\scripts\seed-users.bat</code>.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.role}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-civic-forest text-left transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-emerald-50 text-slate-600 group-hover:text-civic-forest">
                <preset.icon className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {preset.role}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
