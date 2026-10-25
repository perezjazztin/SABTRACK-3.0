'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Lock, LogIn, AlertCircle, Sparkles, Shield, UserCheck, Wrench, UserPlus } from 'lucide-react';

const DEMO_PRESETS = [
  {
    label: 'Resident',
    email: 'resident.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'RESIDENT',
    icon: UserCheck,
  },
  {
    label: 'Staff Reviewer',
    email: 'staff.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'BARANGAY_STAFF',
    icon: Shield,
  },
  {
    label: 'Barangay Admin',
    email: 'admin.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'BARANGAY_ADMIN',
    icon: Shield,
  },
  {
    label: 'Maintainer',
    email: 'maintainer.demo@sabtrack.local',
    password: 'SabtrackDevPass2026!',
    role: 'SYSTEM_MAINTAINER',
    icon: Wrench,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to appropriate role portal
  useEffect(() => {
    if (isAuthenticated && user) {
      if (['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role)) {
        router.push('/admin');
      } else if (user.role === 'RESIDENT') {
        router.push('/resident');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const authenticatedUser = await login({ email, password });
      if (['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(authenticatedUser.role)) {
        router.push('/admin');
      } else if (authenticatedUser.role === 'RESIDENT') {
        router.push('/resident');
      } else {
        router.push('/');
      }
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
    <div className="max-w-md w-full mx-auto px-4 py-8 space-y-6">
      {/* Neumorphic Login Card */}
      <div className="neu-card rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="neu-socket w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign In to SABTRACK
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Barangay Sabang Solid Waste Management Platform
            </p>
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="neu-socket p-3.5 rounded-2xl text-rose-800 text-xs flex items-start space-x-2.5 border border-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
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
              className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
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
              className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn-primary w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-wider disabled:opacity-50"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-600">
          New resident?{' '}
          <Link
            href="/register"
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>

      {/* Development Quick Role Switcher */}
      <div className="neu-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Evaluation Demo Accounts</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Click any role below to pre-populate credentials for RBAC verification.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.role}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="neu-card-interactive flex items-center space-x-2 p-2.5 rounded-xl text-left group"
            >
              <div className="neu-socket p-1.5 rounded-lg text-slate-600 group-hover:text-emerald-700">
                <preset.icon className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 truncate">
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
