'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Raleway } from 'next/font/google';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle,
  Circle,
  CreditCard,
  Eye,
  EyeOff,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  Recycle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import { registerResident, scanGovernmentId, verifyFaceBiometrics } from '@/lib/api-client';
import { SupportedIdType, ExtractedIdData } from '@/types/verification';
import FaceCaptureModal from '@/components/verification/FaceCaptureModal';
import IdCaptureModal from '@/components/verification/IdCaptureModal';

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

const SUPPORTED_IDS: { type: SupportedIdType; label: string }[] = [
  { type: 'PHILIPPINE_NATIONAL_ID', label: 'Philippine National ID (PhilSys)' },
  { type: 'DRIVERS_LICENSE', label: "Driver's License (LTO)" },
  { type: 'PASSPORT', label: 'Philippine Passport (DFA)' },
  { type: 'UMID', label: 'UMID Card (SSS / GSIS)' },
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

/* ---------- Main Component ---------- */

export default function RegisterPage() {
  const router = useRouter();

  // Verification state: Front & Back Government ID
  const [selectedIdType, setSelectedIdType] = useState<SupportedIdType>('PHILIPPINE_NATIONAL_ID');
  const [idFile, setIdFile] = useState<File | null>(null); // Front ID
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null); // Back ID
  const [idBackPreviewUrl, setIdBackPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backFileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeCameraSide, setActiveCameraSide] = useState<'front' | 'back'>('front');

  const [isScanningId, setIsScanningId] = useState(false);
  const [tempVerificationId, setTempVerificationId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [scanSuccessBanner, setScanSuccessBanner] = useState<string | null>(null);

  // Camera modal states
  const [isIdCameraModalOpen, setIsIdCameraModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isMatchingFace, setIsMatchingFace] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<string | null>(null);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [residentIdNum, setResidentIdNum] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Flow & error tracking
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
  const isVerified = Boolean(verificationToken);

  const canSubmit =
    isVerified &&
    fullName.trim().length > 0 &&
    residentIdNum.trim().length > 0 &&
    email.trim().length > 0 &&
    checks.length &&
    password === confirmPassword &&
    acceptedPrivacy;

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
      if (idPreviewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(idPreviewUrl);
      }
      if (idBackPreviewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(idBackPreviewUrl);
      }
    };
  }, [idPreviewUrl, idBackPreviewUrl]);

  useEffect(() => {
    if (errorMessage && typeof errorRef.current?.scrollIntoView === 'function') {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);

  const handleSetIdFile = (file: File | null) => {
    if (idPreviewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(idPreviewUrl);
    }
    setScanSuccessBanner(null);
    setErrorMessage(null);

    if (file) {
      setIdFile(file);
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        setIdPreviewUrl(URL.createObjectURL(file));
      } else {
        setIdPreviewUrl('mock-preview-url');
      }
    } else {
      setIdFile(null);
      setIdPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    // Reset temporary session if front ID image is changed/deleted
    setTempVerificationId(null);
    setExtractedData(null);
    setVerificationToken(null);
    setMatchScore(null);
    setVerificationDetails(null);
  };

  const handleSetBackIdFile = (file: File | null) => {
    if (idBackPreviewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(idBackPreviewUrl);
    }
    setScanSuccessBanner(null);
    setErrorMessage(null);

    if (file) {
      setIdBackFile(file);
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        setIdBackPreviewUrl(URL.createObjectURL(file));
      } else {
        setIdBackPreviewUrl('mock-preview-url-back');
      }
    } else {
      setIdBackFile(null);
      setIdBackPreviewUrl(null);
      if (backFileInputRef.current) {
        backFileInputRef.current.value = '';
      }
    }
  };

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleSetIdFile(file);
  };

  const handleBackIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleSetBackIdFile(file);
  };

  const handleDeleteIdImage = () => {
    handleSetIdFile(null);
  };

  const handleDeleteBackIdImage = () => {
    handleSetBackIdFile(null);
  };

  const handleOpenIdCamera = (side: 'front' | 'back') => {
    setActiveCameraSide(side);
    setIsIdCameraModalOpen(true);
  };

  const handleIdCameraCaptured = (capturedFile: File) => {
    setIsIdCameraModalOpen(false);
    if (activeCameraSide === 'back') {
      handleSetBackIdFile(capturedFile);
    } else {
      handleSetIdFile(capturedFile);
    }
  };

  // Scan & OCR Government ID
  const handleScanId = async () => {
    if (!idFile) {
      setErrorMessage('Please select or capture the front of your government-issued ID.');
      return;
    }
    setErrorMessage(null);
    setIsScanningId(true);
    try {
      const res = await scanGovernmentId(idFile, selectedIdType, idBackFile);
      setTempVerificationId(res.temp_verification_id);
      setExtractedData(res.extracted_data);

      // Auto-populate extracted identity fields directly into form below
      if (res.extracted_data.full_name) {
        setFullName(res.extracted_data.full_name);
      }
      if (res.extracted_data.id_number_masked) {
        setResidentIdNum(res.extracted_data.id_number_masked);
      }

      // Smart auto-detection of Purok if present in address
      if (res.extracted_data.address) {
        const addr = res.extracted_data.address.toUpperCase();
        const matchedPurok = PUROK_OPTIONS.find((p) =>
          addr.includes(`PUROK ${p.id}`) || addr.includes(`ZONE ${p.id}`)
        );
        if (matchedPurok) {
          setAreaId(matchedPurok.id);
        }
      }

      setScanSuccessBanner(
        `ID details extracted successfully! Legal name and ID number have been populated in the form below.`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to scan ID. Ensure the image is sharp, clear, and well-lit.'
      );
    } finally {
      setIsScanningId(false);
    }
  };

  // Face biometrics captured from FaceCaptureModal
  const handleFaceCaptured = async (faceBlob: Blob) => {
    if (!tempVerificationId) {
      setErrorMessage('Verification session expired. Please scan your government ID again.');
      setIsCameraModalOpen(false);
      return;
    }

    setIsCameraModalOpen(false);
    setIsMatchingFace(true);
    setErrorMessage(null);

    try {
      const res = await verifyFaceBiometrics(tempVerificationId, faceBlob);
      setVerificationToken(res.verification_token);
      setMatchScore(res.match_score);
      if (res.details) {
        setVerificationDetails(res.details);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Facial recognition did not match the photo on your uploaded ID. Please try again with good lighting.'
      );
    } finally {
      setIsMatchingFace(false);
    }
  };

  const handleResetVerification = () => {
    handleSetIdFile(null);
    handleSetBackIdFile(null);
    setScanSuccessBanner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isDone) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!verificationToken) {
      setErrorMessage('Identity verification is required. Please verify your Government ID and Face Biometrics.');
      return;
    }
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
        verification_token: verificationToken,
      });

      if (typeof window !== 'undefined' && normalizedResidentId) {
        try {
          localStorage.setItem('sabtrack_registered_resident_id', normalizedResidentId);
        } catch {
          // Ignore storage unavailability in private browsing
        }
      }

      setIsDone(true);
      setSuccessMessage('Resident identity verified and account registered successfully! Redirecting to sign in…');
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
          <p className="text-sm text-slate-500 text-left mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ========================================================= */}
            {/* 2-Step Government ID & Facial Biometric Verification      */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                      Government ID &amp; Facial Biometric Verification
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Two-step verification: Official ID OCR extraction &amp; Live Face Liveness Match
                    </p>
                  </div>
                </div>

                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Verified ({Math.round((matchScore || 0) * 100)}%)
                  </span>
                )}
              </div>

              {!isVerified ? (
                <div className="space-y-3.5 pt-1">
                  {/* ---------------------------------------------------- */}
                  {/* Step 1: Government ID Document (Upload or Camera)    */}
                  {/* ---------------------------------------------------- */}
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">1</span>
                        Step 1: Government ID Document
                      </span>
                      {tempVerificationId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          ID Scanned &amp; Details Extracted
                        </span>
                      )}
                    </div>

                    {/* Select ID Type */}
                    <div>
                      <label htmlFor="idType" className="block text-xs font-semibold text-slate-700 mb-1">
                        Select Government ID Type
                      </label>
                      <select
                        id="idType"
                        name="idType"
                        value={selectedIdType}
                        onChange={(e) => setSelectedIdType(e.target.value as SupportedIdType)}
                        disabled={locked || isScanningId || isMatchingFace}
                        className={`${underlineInput} cursor-pointer text-xs`}
                      >
                        {SUPPORTED_IDS.map((id) => (
                          <option key={id.type} value={id.type}>
                            {id.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Government ID Images (Front & Back) */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                          Government ID Images (Front &amp; Back)
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Provide both the front and back of your ID using your device camera or image upload.
                        </p>
                      </div>

                      {/* 2-Column Responsive Card Grid for Front and Back of ID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* ==================== FRONT OF ID ==================== */}
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Front of ID</span>
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                Required
                              </span>
                            </span>
                            {idFile && (
                              <button
                                type="button"
                                onClick={handleDeleteIdImage}
                                disabled={locked || isScanningId}
                                aria-label="Delete ID image"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 transition"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          {/* Hidden file input for front of ID */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="idUploadInput"
                            name="idUploadInput"
                            data-testid="id-upload-input"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={locked || isScanningId || isMatchingFace}
                            onChange={handleIdFileChange}
                            className="sr-only"
                          />

                          {/* ID Card Shape Container */}
                          <div
                            className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                              idFile
                                ? 'border-emerald-300 bg-slate-950 shadow-sm'
                                : 'border-2 border-dashed border-emerald-300/80 bg-white hover:border-emerald-500 hover:bg-emerald-50/20'
                            }`}
                          >
                            {idFile ? (
                              <>
                                {idPreviewUrl ? (
                                  <img
                                    src={idPreviewUrl}
                                    alt="Front of ID Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-emerald-950 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-emerald-400" />
                                  </div>
                                )}
                                {/* Bottom Action Bar Overlay */}
                                <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 border-t border-slate-700/60 flex items-center justify-between text-white animate-in fade-in">
                                  <div className="truncate mr-2">
                                    <p className="text-[11px] font-bold text-white truncate max-w-[120px] sm:max-w-[140px]">
                                      {idFile.name}
                                    </p>
                                    <p className="text-[10px] text-emerald-300">
                                      {(idFile.size / 1024).toFixed(0)} KB &bull; Front Ready
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <label
                                      htmlFor="idUploadInput"
                                      title="Replace Front Image"
                                      aria-label="Replace Front Image"
                                      className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenIdCamera('front')}
                                      disabled={locked || isScanningId || isMatchingFace}
                                      title="Retake Front Photo"
                                      aria-label="Retake Front Photo"
                                      className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-1">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800">
                                  Front Side
                                </p>
                                <p className="text-[10px] text-slate-500 mb-2">
                                  Portrait &amp; Full Legal Name
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                  <label
                                    htmlFor="idUploadInput"
                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 cursor-pointer shadow-sm transition"
                                  >
                                    <Upload className="w-3 h-3 text-emerald-600" />
                                    <span>Choose ID File</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenIdCamera('front')}
                                    disabled={locked || isScanningId || isMatchingFace}
                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition"
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span>Scan with Camera</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ==================== BACK OF ID ==================== */}
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                              <span>Back of ID</span>
                              <span className="text-[10px] font-normal text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                Recommended
                              </span>
                            </span>
                            {idBackFile && (
                              <button
                                type="button"
                                onClick={handleDeleteBackIdImage}
                                disabled={locked || isScanningId}
                                aria-label="Delete back ID image"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 transition"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          {/* Hidden file input for back of ID */}
                          <input
                            ref={backFileInputRef}
                            type="file"
                            id="idUploadBackInput"
                            name="idUploadBackInput"
                            data-testid="id-upload-back-input"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={locked || isScanningId || isMatchingFace}
                            onChange={handleBackIdFileChange}
                            className="sr-only"
                          />

                          {/* ID Card Shape Container */}
                          <div
                            className={`relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                              idBackFile
                                ? 'border-emerald-300 bg-slate-950 shadow-sm'
                                : 'border-2 border-dashed border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
                            }`}
                          >
                            {idBackFile ? (
                              <>
                                {idBackPreviewUrl ? (
                                  <img
                                    src={idBackPreviewUrl}
                                    alt="Back of ID Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                  </div>
                                )}
                                {/* Bottom Action Bar Overlay */}
                                <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 border-t border-slate-700/60 flex items-center justify-between text-white animate-in fade-in">
                                  <div className="truncate mr-2">
                                    <p className="text-[11px] font-bold text-white truncate max-w-[120px] sm:max-w-[140px]">
                                      {idBackFile.name}
                                    </p>
                                    <p className="text-[10px] text-emerald-300">
                                      {(idBackFile.size / 1024).toFixed(0)} KB &bull; Back Ready
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <label
                                      htmlFor="idUploadBackInput"
                                      title="Replace Back Image"
                                      aria-label="Replace Back Image"
                                      className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition"
                                    >
                                      <Upload className="w-3.5 h-3.5" />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenIdCamera('back')}
                                      disabled={locked || isScanningId || isMatchingFace}
                                      title="Retake Back Photo"
                                      aria-label="Retake Back Photo"
                                      className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-1">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800">
                                  Back Side
                                </p>
                                <p className="text-[10px] text-slate-500 mb-2">
                                  Barcode, Address &amp; Signature
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                  <label
                                    htmlFor="idUploadBackInput"
                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-300 hover:bg-slate-200 hover:border-slate-400 cursor-pointer shadow-sm transition"
                                  >
                                    <Upload className="w-3 h-3 text-slate-600" />
                                    <span>Upload Back</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenIdCamera('back')}
                                    disabled={locked || isScanningId || isMatchingFace}
                                    aria-label="Take Back Photo"
                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white bg-slate-700 hover:bg-slate-800 shadow-sm transition"
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span>Take Back Photo</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Scan Trigger Button & Feedback */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleScanId}
                          disabled={locked || !idFile || isScanningId || Boolean(tempVerificationId)}
                          className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {isScanningId ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Extracting details…
                            </>
                          ) : tempVerificationId ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Details Extracted
                            </>
                          ) : (
                            'Scan & Process ID'
                          )}
                        </button>

                        {tempVerificationId ? (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            ✓ ID processed. Extracted details pasted below.
                          </span>
                        ) : idFile ? (
                          <span className="text-[11px] text-slate-500">
                            {idBackFile ? 'Front & Back IDs ready to scan.' : 'Front ID ready to scan (Back ID optional).'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Feedback banner when ID scan finishes and pastes details */}
                  {scanSuccessBanner && (
                    <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{scanSuccessBanner}</span>
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* Step 2: Facial Biometric Verification (Always Visible)*/}
                  {/* ---------------------------------------------------- */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      tempVerificationId
                        ? 'bg-white border-emerald-300 shadow-sm ring-2 ring-emerald-500/10'
                        : 'bg-slate-50/80 border-slate-200/80 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                              tempVerificationId
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            2
                          </span>
                          <p className="text-xs font-bold text-slate-800">
                            Step 2: Live Facial Biometric Verification
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-7">
                          {tempVerificationId
                            ? 'Camera active liveness: Follow prompts (head turns & blink) to match your live face with the ID portrait.'
                            : 'Complete Step 1 (Scan Government ID) above to unlock live facial recognition.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        disabled={locked || !tempVerificationId || isMatchingFace}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-700/20 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                      >
                        {isMatchingFace ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Matching Biometrics…
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 mr-1.5" />
                            Start Face Verification
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Verified Summary */
                <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {extractedData?.full_name || fullName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {SUPPORTED_IDS.find((i) => i.type === selectedIdType)?.label} &bull;{' '}
                          {extractedData?.id_number_masked || residentIdNum}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetVerification}
                      disabled={locked}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Re-verify
                    </button>
                  </div>
                  {verificationDetails && (
                    <div className="text-[11px] text-emerald-900 bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2.5 leading-relaxed">
                      <span className="font-bold text-emerald-950">Feature Analysis:</span> {verificationDetails}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Full legal name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="fullName" className={labelClass}>
                  Full legal name
                </label>
                {tempVerificationId && (
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Extracted from ID (editable)
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
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
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="residentIdNum" className={labelClass}>
                    Resident ID number
                  </label>
                  {tempVerificationId && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Extracted from ID
                    </span>
                  )}
                </div>
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
                  Your official Barangay Sabang or verified government ID number.
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

            {/* Verification Status Guidance */}
            {!isVerified && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-xl p-2.5 text-center">
                Please complete the Government ID and Face Biometrics verification above to enable account creation.
              </p>
            )}

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

            {/* Mobile-only privacy note */}
            <p className="md:hidden flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed pt-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-700" aria-hidden="true" />
              EXIF GPS metadata is removed from report evidence, and your identity is never shown on
              public feeds.
            </p>
          </form>
        </div>
      </section>

      {/* Direct Camera Scanner Modal for Government ID */}
      <IdCaptureModal
        isOpen={isIdCameraModalOpen}
        side={activeCameraSide}
        onCapture={handleIdCameraCaptured}
        onClose={() => setIsIdCameraModalOpen(false)}
      />

      {/* Active Liveness Face Capture Modal */}
      <FaceCaptureModal
        isOpen={isCameraModalOpen}
        onCapture={handleFaceCaptured}
        onClose={() => setIsCameraModalOpen(false)}
      />
    </div>
  );
}
