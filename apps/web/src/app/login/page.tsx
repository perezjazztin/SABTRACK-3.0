'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Raleway } from 'next/font/google';
import { useAuth } from '@/lib/auth-context';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Recycle,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

const raleway = Raleway({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

const ADMIN_ROLES = ['BARANGAY_STAFF', 'BARANGAY_ADMIN'];

// Single source of truth for role -> portal routing.
function getRedirectPath(role: string): string {
  if (ADMIN_ROLES.includes(role)) return '/admin';
  if (role === 'RESIDENT') return '/resident';
  return '/';
}

/* ---------- Shared styles (identical to register) ---------- */

const labelClass = 'block text-sm font-semibold text-slate-800 mb-1';
const underlineInput =
  'w-full bg-transparent border-0 border-b-2 border-emerald-200 px-0 pt-1.5 pb-2 pr-8 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 outline-none focus:outline-none focus-visible:outline-none transition-colors focus:border-emerald-600 focus:ring-0 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-rose-400';

function ValidTick({ show }: { show: boolean }) {
  return (
    <Check
      className={`pointer-events-none absolute right-0 bottom-3 w-4 h-4 text-emerald-500 transition-opacity ${show ? 'opacity-100' : 'opacity-0'
        }`}
      aria-hidden="true"
    />
  );
}

/* Layered organic wave edge between the green panel and the white form panel. */
function CloudEdge() {
  return (
    <svg
      className="hidden md:block absolute inset-y-0 -right-px h-full w-24 lg:w-32 pointer-events-none z-20"
      viewBox="0 0 100 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        fill="#ffffff"
        fillOpacity="0.18"
        d="M100,0 L18,0 C-2,45 40,75 14,120 C-8,160 36,200 12,245 C-10,290 34,325 10,372 C-8,415 36,455 14,500 C-2,540 30,572 18,600 L100,600 Z"
      />
      <path
        fill="#ffffff"
        fillOpacity="0.35"
        d="M100,0 L40,0 C18,42 62,78 36,122 C12,165 58,205 34,250 C12,295 56,330 32,375 C12,420 58,458 36,503 C20,540 52,574 40,600 L100,600 Z"
      />
      <path
        fill="#ffffff"
        d="M100,0 L66,0 C44,38 86,72 62,116 C40,158 82,198 60,242 C40,286 80,324 58,368 C40,410 82,448 62,494 C48,530 76,568 66,600 L100,600 Z"
      />
    </svg>
  );
}

/* ---------- Page ---------- */

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const navigateTo = (path: string) => {
    if (typeof router.push === 'function') {
      router.push(path);
    } else if (typeof router.replace === 'function') {
      router.replace(path);
    }
  };

  // Already signed in: send them to their portal.
  useEffect(() => {
    if (isAuthenticated && user) {
      navigateTo(getRedirectPath(user.role));
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const authenticatedUser = await login({ email: email.trim(), password });
      // Keep loading state active during navigation
      navigateTo(getRedirectPath(authenticatedUser.role));
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : 'We could not sign you in. Please check your details and try again.'
      );
      setPassword('');
      setIsSubmitting(false);
    }
  };

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const clearError = () => {
    if (errorMessage) setErrorMessage(null);
  };

  // Avoid flashing the form while an authenticated user is being redirected.
  if (isAuthenticated && user) {
    return (
      <div
        className={`${raleway.className} w-full min-h-screen flex flex-col items-center justify-center gap-3 text-slate-600 bg-white`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
        <p className="text-sm font-medium">You&apos;re signed in. Redirecting…</p>
      </div>
    );
  }

  const errorId = 'login-error';

  return (
    <div className={`${raleway.className} w-full min-h-screen flex flex-col md:flex-row relative bg-white overflow-x-hidden`}>
      {/* ---------- Left: full-height brand panel ---------- */}
      <aside className="relative w-full md:w-[38%] lg:w-[34%] bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#022c22] text-white px-8 sm:px-12 pt-28 sm:pt-32 md:pt-36 pb-12 flex flex-col justify-between items-center text-center shrink-0 z-10">
        <div className="flex flex-col items-center gap-4 md:flex-1 md:justify-center md:pr-6 max-w-xs mx-auto">
          <p className="text-lg font-semibold tracking-wide text-emerald-100">Welcome to</p>

          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl shadow-emerald-950/40 my-1">
            <Recycle className="w-12 h-12 text-emerald-700" aria-hidden="true" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight -mt-1 text-white">SABTRACK 3.0</h2>

          <p className="text-xs sm:text-sm leading-relaxed text-emerald-100/90 font-normal max-w-[16rem]">
            The Barangay Sabang Solid Waste Management Platform. Sign in to monitor collection schedules,
            submit violation reports, and earn civic SAB-Points.
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-left text-xs leading-relaxed text-emerald-100/80 md:pr-6 mt-8 max-w-[17rem]">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-200" aria-hidden="true" />
          <p>
            <span className="font-bold text-white">Privacy-first.</span> Authenticated session
            security with encrypted credentials and zero public identity leakage.
          </p>
        </div>

        <CloudEdge />
      </aside>

      {/* ---------- Right: full-height form panel ---------- */}
      <section className="flex-1 w-full bg-white flex flex-col justify-center px-6 sm:px-12 md:px-14 lg:px-20 pt-28 sm:pt-32 md:pt-36 pb-16 relative z-10 overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-left mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 text-left mb-8">
            Sign in to your SABTRACK account to continue
          </p>

          {/* Error alert (announced to screen readers) */}
          {errorMessage && (
            <div
              id={errorId}
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5 border border-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Account Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={errorMessage ? errorId : undefined}
                  placeholder="e.g. resident@example.com"
                  className={underlineInput}
                />
                <ValidTick show={emailLooksValid} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  onKeyUp={handleKeyEvent}
                  onKeyDown={handleKeyEvent}
                  onBlur={() => setCapsLockOn(false)}
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={errorMessage ? errorId : undefined}
                  placeholder="Enter your password"
                  className={underlineInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? 'Hide entry' : 'Show entry'}
                  aria-pressed={showPassword}
                  className="absolute right-0 bottom-2 p-1 text-slate-400 hover:text-emerald-700 focus-visible:text-emerald-700 outline-none rounded transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {capsLockOn && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700" role="status">
                  <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Caps Lock is on</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                aria-busy={isSubmitting}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white
                  bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-700/30
                  transition hover:from-emerald-500 hover:to-emerald-800 hover:shadow-emerald-700/40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>

              <Link
                href="/register"
                aria-disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold
                  text-emerald-800 border-2 border-emerald-200 bg-white transition
                  hover:border-emerald-500 hover:bg-emerald-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Sign up
              </Link>
            </div>

            {/* Helper text */}
            <p className="text-xs text-slate-500 text-center pt-2">
              New resident? Create an account to get started.
            </p>
          </form>

          <p className="text-center text-xs text-slate-500 mt-8">
            <Link href="/" className="hover:text-emerald-700 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}