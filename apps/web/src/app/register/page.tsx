'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Raleway } from 'next/font/google';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Recycle,
  ShieldCheck,
} from 'lucide-react';
import { registerResident } from '@/lib/api-client';

const raleway = Raleway({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

const PUROK_OPTIONS = [
  { id: 1, name: 'Purok 1 - Zone North' },
  { id: 2, name: 'Purok 2 - Zone Central' },
  { id: 3, name: 'Purok 3 - Zone South' },
  { id: 4, name: 'Purok 4 - Riverside' },
  { id: 5, name: 'Purok 5 - Main Highway' },
  { id: 6, name: 'Purok 6 - Commercial District' },
  { id: 7, name: 'Purok 7 - Agricultural Perimeter' },
];

const MIN_PASSWORD_LENGTH = 8;

/* ---------- Password helpers ---------- */

function getPasswordChecks(password: string) {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    long: password.length >= 12,
  };
}

// Advisory only. The only hard rule is the minimum length;
// the server remains the source of truth for password policy.
function getStrength(password: string) {
  if (!password) return { score: 0, label: '', barClass: '', textClass: '' };
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length; // 0-5

  if (!checks.length || score <= 2) {
    return { score: 1, label: 'Weak', barClass: 'bg-rose-500', textClass: 'text-rose-700' };
  }
  if (score === 3) {
    return { score: 2, label: 'Fair', barClass: 'bg-amber-500', textClass: 'text-amber-700' };
  }
  if (score === 4) {
    return { score: 3, label: 'Good', barClass: 'bg-emerald-500', textClass: 'text-emerald-700' };
  }
  return { score: 4, label: 'Strong', barClass: 'bg-emerald-600', textClass: 'text-emerald-800' };
}

/* ---------- Shared styles ---------- */

const labelClass = 'block text-sm font-semibold text-slate-800 mb-1';
const underlineInput =
  'w-full bg-transparent border-0 border-b-2 border-emerald-200 px-0 pt-1.5 pb-2 pr-8 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 outline-none focus:outline-none focus-visible:outline-none transition-colors focus:border-emerald-600 focus:ring-0 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-rose-400';

/* ---------- Reusable pieces ---------- */

function ValidTick({ show }: { show: boolean }) {
  return (
    <Check
      className={`pointer-events-none absolute right-0 bottom-3 w-4 h-4 text-emerald-500 transition-opacity ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    />
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
  describedBy,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          placeholder={placeholder}
          className={underlineInput}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          disabled={disabled}
          aria-label={show ? 'Hide entry' : 'Show entry'}
          aria-pressed={show}
          className="absolute right-0 bottom-2 p-1 text-slate-400 hover:text-emerald-700 focus-visible:text-emerald-700 outline-none rounded transition-colors"
        >
          {show ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${met ? 'text-emerald-700' : 'text-slate-500'}`}>
      {met ? (
        <CheckCircle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      ) : (
        <Circle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      )}
      <span>
        {children}
        <span className="sr-only">{met ? ' (met)' : ' (not met yet)'}</span>
      </span>
    </li>
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

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [residentIdNum, setResidentIdNum] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => getStrength(password), [password]);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canSubmit =
    fullName.trim().length > 0 &&
    residentIdNum.trim().length > 0 &&
    email.trim().length > 0 &&
    checks.length &&
    password === confirmPassword &&
    acceptedPrivacy;

  // Clean up the pending redirect if the user leaves the page.
  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  // The form is long, so bring the error into view on small screens.
  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isDone) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Defensive checks (the button is already disabled until these pass).
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check both entries.');
      return;
    }
    if (!acceptedPrivacy) {
      setErrorMessage('You must acknowledge the RA 10173 Data Privacy consent.');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedResidentId = residentIdNum.trim().toUpperCase();

      await registerResident({
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        area_id: areaId ? Number(areaId) : null,
        resident_id_num: normalizedResidentId || undefined,
      });

      if (typeof window !== 'undefined' && normalizedResidentId) {
        try {
          localStorage.setItem('sabtrack_registered_resident_id', normalizedResidentId);
        } catch {
          // Storage can be unavailable (private mode, blocked site data). Safe to ignore.
        }
      }

      // Stay in the submitting state so the form can't be sent twice during the redirect.
      setIsDone(true);
      setSuccessMessage('Resident account registered successfully! Redirecting you to sign in…');
      redirectTimer.current = setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : 'Registration failed. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const locked = isSubmitting || isDone;
  const errorId = 'register-error';
  const mismatchId = 'confirm-password-status';
  const requirementsId = 'password-requirements';

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
            Join SABTRACK 3.0 to access collection schedules, submit violation reports, and earn
            civic SAB-Points.
          </p>
        </div>

        <div className="flex items-start gap-2.5 text-left text-xs leading-relaxed text-emerald-100/80 md:pr-6 mt-8 max-w-[17rem]">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-200" aria-hidden="true" />
          <p>
            <span className="font-bold text-white">Privacy-first.</span> EXIF GPS metadata is
            removed from report evidence, and your identity is never shown on public feeds.
          </p>
        </div>

        <CloudEdge />
      </aside>

      {/* ---------- Right: full-height form panel ---------- */}
      <section className="flex-1 w-full bg-white flex flex-col justify-center px-6 sm:px-12 md:px-14 lg:px-20 pt-28 sm:pt-32 md:pt-36 pb-16 relative z-10 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-left mb-2">
            Register as a Resident
          </h1>
          <p className="text-sm text-slate-500 text-left mb-8">
            Create your resident account to access schedules and earn SAB-Points
          </p>

          {/* Alerts */}
          {errorMessage && (
            <div
              id={errorId}
              ref={errorRef}
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5 border border-rose-200"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-start gap-2.5 border border-emerald-200"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full legal name
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  required
                  disabled={locked}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className={underlineInput}
                />
                <ValidTick show={fullName.trim().length > 1} />
              </div>
            </div>

            {/* Resident ID + Purok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="residentIdNum" className={labelClass}>
                  Resident ID number
                </label>
                <div className="relative">
                  <input
                    id="residentIdNum"
                    name="residentIdNum"
                    type="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    required
                    disabled={locked}
                    value={residentIdNum}
                    onChange={(e) => setResidentIdNum(e.target.value.toUpperCase())}
                    aria-describedby="residentIdHelp"
                    placeholder="e.g. SAB-2026-0042"
                    className={`${underlineInput} uppercase font-mono tracking-wide`}
                  />
                  <ValidTick show={residentIdNum.trim().length > 3} />
                </div>
                <p id="residentIdHelp" className="text-[11px] text-slate-500 mt-1">
                  Your official Barangay Sabang ID.
                </p>
              </div>

              <div>
                <label htmlFor="purok" className={labelClass}>
                  Purok / Barangay Zone{' '}
                  <span className="font-medium text-slate-400 text-xs">(optional)</span>
                </label>
                <select
                  id="purok"
                  name="purok"
                  disabled={locked}
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
                  className={`${underlineInput} pr-0 cursor-pointer ${
                    areaId === '' ? 'text-slate-400' : ''
                  }`}
                >
                  <option value="">Select your Purok</option>
                  {PUROK_OPTIONS.map((purok) => (
                    <option key={purok.id} value={purok.id} className="text-slate-900">
                      {purok.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
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
                  required
                  disabled={locked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmail((v) => v.trim().toLowerCase())}
                  placeholder="e.g. resident@example.com"
                  className={underlineInput}
                />
                <ValidTick show={emailLooksValid} />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder={`Min ${MIN_PASSWORD_LENGTH} characters`}
                disabled={locked}
                describedBy={requirementsId}
              />
              <div>
                <PasswordField
                  id="confirmPassword"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter password"
                  disabled={locked}
                  invalid={passwordsMismatch}
                  describedBy={mismatchId}
                />
                <p
                  id={mismatchId}
                  role="status"
                  className={`mt-1 text-[11px] min-h-[1rem] ${
                    passwordsMismatch ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {passwordsMismatch && 'Passwords do not match'}
                  {passwordsMatch && 'Passwords match'}
                </p>
              </div>
            </div>

            {/* Strength meter + requirements */}
            {password.length > 0 && (
              <div id={requirementsId} className="space-y-2 -mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1" aria-hidden="true">
                    {[1, 2, 3, 4].map((segment) => (
                      <div
                        key={segment}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          segment <= strength.score ? strength.barClass : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[11px] font-bold w-12 text-right ${strength.textClass}`}
                    aria-live="polite"
                  >
                    {strength.label}
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <Requirement met={checks.length}>At least {MIN_PASSWORD_LENGTH} characters</Requirement>
                  <Requirement met={checks.mixedCase}>Upper &amp; lowercase letters</Requirement>
                  <Requirement met={checks.number}>At least one number</Requirement>
                  <Requirement met={checks.symbol}>At least one symbol</Requirement>
                </ul>
              </div>
            )}

            {/* Privacy consent */}
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                required
                disabled={locked}
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                I agree to the processing of my civic data under the{' '}
                <strong className="text-emerald-800">Philippine Data Privacy Act (RA 10173)</strong>{' '}
                and Ecological Solid Waste Management guidelines.
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={locked || !canSubmit}
                aria-label="Create Resident Account"
                aria-busy={isSubmitting}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white
                  bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-700/30
                  transition hover:from-emerald-500 hover:to-emerald-800 hover:shadow-emerald-700/40
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                ) : isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : null}
                {isDone ? 'Account created' : isSubmitting ? 'Creating account…' : 'Create Resident Account'}
              </button>

              <Link
                href="/login"
                aria-disabled={locked}
                className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold
                  text-emerald-800 border-2 border-emerald-200 bg-white transition
                  hover:border-emerald-500 hover:bg-emerald-50
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
            </div>

            {/* Mobile-only privacy note (desktop shows it in the green panel) */}
            <p className="md:hidden flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed pt-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
              EXIF GPS metadata is removed from report evidence, and your identity is never shown on
              public feeds.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
