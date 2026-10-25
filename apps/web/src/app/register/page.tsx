'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { registerResident } from '@/lib/api-client';

const PUROK_OPTIONS = [
  { id: 1, name: 'Purok 1 - Zone North' },
  { id: 2, name: 'Purok 2 - Zone Central' },
  { id: 3, name: 'Purok 3 - Zone South' },
  { id: 4, name: 'Purok 4 - Riverside' },
  { id: 5, name: 'Purok 5 - Main Highway' },
  { id: 6, name: 'Purok 6 - Commercial District' },
  { id: 7, name: 'Purok 7 - Agricultural Perimeter' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [residentIdNum, setResidentIdNum] = useState('');

  const handleGenerateResidentId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setResidentIdNum(`SAB-2026-${randomNum}`);
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password entry.');
      return;
    }

    if (!acceptedPrivacy) {
      setErrorMessage('You must acknowledge the RA 10173 Data Privacy consent.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerResident({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        area_id: areaId ? Number(areaId) : null,
        resident_id_num: residentIdNum.trim().toUpperCase() || undefined,
      });

      if (typeof window !== 'undefined' && residentIdNum.trim()) {
        try {
          localStorage.setItem('sabtrack_registered_resident_id', residentIdNum.trim().toUpperCase());
        } catch {
          // Ignore localStorage error
        }
      }

      setSuccessMessage('Resident account registered successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg w-full mx-auto px-4 py-8 space-y-6">
      {/* Neumorphic Registration Card */}
      <div className="neu-card rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="neu-socket w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Register as a Resident
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Join SABTRACK 3.0 to access collection schedules, submit violation reports, and earn civic SAB-Points.
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

        {successMessage && (
          <div
            role="status"
            className="neu-socket p-3.5 rounded-2xl text-emerald-800 text-xs flex items-start space-x-2.5 border border-emerald-200"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Full Legal Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="residentIdNum"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Resident ID Number
              </label>
              <button
                type="button"
                onClick={handleGenerateResidentId}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                Auto-Generate ID
              </button>
            </div>
            <input
              id="residentIdNum"
              type="text"
              required
              value={residentIdNum}
              onChange={(e) => setResidentIdNum(e.target.value.toUpperCase())}
              placeholder="e.g. SAB-2026-0042"
              className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all uppercase font-mono tracking-wide"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Official Barangay Sabang Citizen ID number or click Auto-Generate.
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. resident@example.com"
              className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="purok"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Purok / Barangay Zone
            </label>
            <select
              id="purok"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
              className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all bg-[#e9eff5]"
            >
              <option value="">Select your Purok in Barangay Sabang</option>
              {PUROK_OPTIONS.map((purok) => (
                <option key={purok.id} value={purok.id}>
                  {purok.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          {/* Privacy Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start space-x-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>
                I agree to the processing of my civic data pursuant to the{' '}
                <strong className="text-slate-800">Philippine Data Privacy Act (RA 10173)</strong> and Ecological Solid Waste Management guidelines.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn-primary w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-wider disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Registering Account...' : 'Create Resident Account'}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-200/60 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Sign in to SABTRACK
          </Link>
        </div>
      </div>

      {/* Trust & Privacy Notice */}
      <div className="neu-card rounded-2xl p-5 flex items-start space-x-3 text-xs text-slate-600">
        <div className="neu-socket p-2 rounded-xl text-emerald-700 flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">Privacy-First Architecture</h4>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Report evidence submitted through SABTRACK is automatically sanitized: EXIF GPS metadata is removed upon ingestion, and personal identity is never displayed on public feeds.
          </p>
        </div>
      </div>
    </div>
  );
}
