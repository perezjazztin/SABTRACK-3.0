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
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  Recycle,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from 'lucide-react';
import { registerResident, scanGovernmentId, verifyFaceBiometrics } from '@/lib/api-client';
import { SupportedIdType, ExtractedIdData } from '@/types/verification';
import FaceCaptureModal from '@/components/verification/FaceCaptureModal';

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

const SUPPORTED_IDS: { type: SupportedIdType; label: string; desc: string }[] = [
  {
    type: 'PHILIPPINE_NATIONAL_ID',
    label: 'Philippine National ID (PhilSys)',
    desc: 'Digital or physical PhilSys national ID card',
  },
  {
    type: 'DRIVERS_LICENSE',
    label: "Driver's License (LTO)",
    desc: 'Official Land Transportation Office driver license card',
  },
  {
    type: 'PASSPORT',
    label: 'Philippine Passport (DFA)',
    desc: 'Biometric DFA passport bio-page',
  },
  {
    type: 'UMID',
    label: 'UMID Card',
    desc: 'Unified Multi-Purpose Identification (SSS / GSIS)',
  },
];

const MIN_PASSWORD_LENGTH = 8;

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
  const score = Object.values(checks).filter(Boolean).length;
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

const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';
const underlineInput =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 outline-none focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all ' +
  'disabled:opacity-60 disabled:bg-slate-100';

export default function RegisterPage() {
  const router = useRouter();

  // Verification State (Steps 1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedIdType, setSelectedIdType] = useState<SupportedIdType>('PHILIPPINE_NATIONAL_ID');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);

  const [isScanningId, setIsScanningId] = useState<boolean>(false);
  const [tempVerificationId, setTempVerificationId] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);

  // Step 3 & 4 (Face Registration & Matching)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isMatchingFace, setIsMatchingFace] = useState<boolean>(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Step 5 (Personal Info Review)
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [address, setAddress] = useState('');
  const [residentIdNum, setResidentIdNum] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission & Notifications
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => getStrength(password), [password]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const url = URL.createObjectURL(file);
        setIdPreviewUrl(url);
      } else {
        setIdPreviewUrl('mock-preview-url');
      }
    }
  };

  // Step 2: Trigger ID Scanning & OCR
  const handleScanId = async () => {
    if (!idFile) {
      setErrorMessage('Please upload a clear government ID document image.');
      return;
    }
    setErrorMessage(null);
    setIsScanningId(true);
    try {
      const res = await scanGovernmentId(idFile, selectedIdType);
      setTempVerificationId(res.temp_verification_id);
      setExtractedData(res.extracted_data);

      // Pre-fill fields for Step 5
      setFullName(res.extracted_data.full_name);
      setDob(res.extracted_data.dob || '');
      setAge(res.extracted_data.age || '');
      setAddress(res.extracted_data.address || '');
      setResidentIdNum(res.extracted_data.id_number_masked);

      setCurrentStep(3); // Advance to Face Capture Prompt
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'ID scanning failed. Please ensure the photo is readable with good lighting and retry.'
      );
    } finally {
      setIsScanningId(false);
    }
  };

  // Step 4: Face Biometric Capture & Verification
  const handleFaceCaptured = async (faceBlob: Blob) => {
    if (!tempVerificationId) {
      setErrorMessage('Verification session expired. Please rescan your government ID.');
      setIsCameraModalOpen(false);
      setCurrentStep(1);
      return;
    }

    setIsCameraModalOpen(false);
    setIsMatchingFace(true);
    setErrorMessage(null);

    try {
      const res = await verifyFaceBiometrics(tempVerificationId, faceBlob);
      setVerificationToken(res.verification_token);
      setMatchScore(res.match_score);
      setCurrentStep(5); // Unlock Step 5 Personal Information Review
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Face recognition could not confirm a match with the photograph on the uploaded ID. Please retry.'
      );
    } finally {
      setIsMatchingFace(false);
    }
  };

  // Step 6: Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || currentStep === 6) return;

    setErrorMessage(null);

    if (!verificationToken) {
      setErrorMessage('Identity verification is required before completing registration.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check both password entries.');
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
        resident_id_num: residentIdNum || undefined,
        verification_token: verificationToken,
      });

      setCurrentStep(6);
      setSuccessMessage('Resident identity verified and account registered successfully! Redirecting to login…');
      redirectTimer.current = setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Registration failed. Please check your details and try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${raleway.className} w-full min-h-screen flex flex-col md:flex-row relative bg-white overflow-x-hidden`}>
      {/* Left Brand Panel */}
      <aside className="relative w-full md:w-[38%] lg:w-[34%] bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#022c22] text-white px-8 sm:px-12 pt-24 pb-12 flex flex-col justify-between items-center text-center shrink-0 z-10">
        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
          <p className="text-lg font-semibold tracking-wide text-emerald-100">Welcome to</p>
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl shadow-emerald-950/40 my-1">
            <Recycle className="w-10 h-10 text-emerald-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">SABTRACK 3.0</h2>
          <p className="text-xs sm:text-sm leading-relaxed text-emerald-100/90 font-normal">
            Barangay Sabang Digital Governance Platform &bull; Integrated Identity Verification
          </p>

          {/* Verification Step Indicator */}
          <div className="w-full mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-left space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Verification Workflow:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-white font-semibold' : 'text-emerald-300/60'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep > 1 ? 'text-emerald-300' : 'text-white'}`} />
                <span>1. Valid ID Upload</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-white font-semibold' : 'text-emerald-300/60'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep > 2 ? 'text-emerald-300' : 'text-white'}`} />
                <span>2. OCR Information Extraction</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-white font-semibold' : 'text-emerald-300/60'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep > 4 ? 'text-emerald-300' : 'text-white'}`} />
                <span>3. Live Face Registration</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-white font-semibold' : 'text-emerald-300/60'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep >= 5 ? 'text-emerald-300' : 'text-white'}`} />
                <span>4. Face Recognition Matching</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 5 ? 'text-white font-semibold' : 'text-emerald-300/60'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep >= 6 ? 'text-emerald-300' : 'text-white'}`} />
                <span>5. Personal Information Review</span>
              </div>
              <div className={`flex items-center gap-2 ${currentStep >= 6 ? 'text-white font-semibold' : 'text-emerald-300/60'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep >= 6 ? 'text-emerald-300' : 'text-white'}`} />
                <span>6. Final Verification Result</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 text-left text-xs leading-relaxed text-emerald-100/80 mt-8 max-w-[17rem]">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-200" />
          <p>
            <span className="font-bold text-white">RA 10173 Protected.</span> Ephemeral facial recognition ensures live biometric frames are purged immediately upon verification.
          </p>
        </div>
      </aside>

      {/* Right Form / Wizard Section */}
      <section className="flex-1 w-full bg-white flex flex-col justify-center px-6 sm:px-12 md:px-14 lg:px-20 pt-16 pb-16 relative z-10 overflow-y-auto">
        <div className="max-w-xl w-full mx-auto">
          {/* Header */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
              <FileCheck2 className="w-3.5 h-3.5" />
              Integrated Identity Verification
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Resident Account Registration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Complete the automated 6-step identity check to register for Barangay Sabang waste services
            </p>
          </div>

          {/* Error & Success Messages */}
          {errorMessage && (
            <div
              ref={errorRef}
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 mb-6 animate-in fade-in"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Alert</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 mb-6 animate-in fade-in">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-semibold">Success!</p>
                <p className="text-xs mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1 & 2: VALID ID UPLOAD & OCR SCANNING                     */}
          {/* ============================================================== */}
          {currentStep <= 2 && (
            <div className="space-y-6">
              {/* Supported ID Guidance Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supported Government-Issued IDs (IT-312 Requirement):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUPPORTED_IDS.map((id) => (
                    <button
                      key={id.type}
                      type="button"
                      onClick={() => setSelectedIdType(id.type)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        selectedIdType === id.type
                          ? 'border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{id.label}</span>
                        {selectedIdType === id.type && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{id.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Selector Dropdown */}
              <div>
                <label htmlFor="id-type-select" className={labelClass}>
                  Select Government ID Type
                </label>
                <select
                  id="id-type-select"
                  value={selectedIdType}
                  onChange={(e) => setSelectedIdType(e.target.value as SupportedIdType)}
                  className={underlineInput}
                >
                  {SUPPORTED_IDS.map((id) => (
                    <option key={id.type} value={id.type}>
                      {id.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Zone */}
              <div>
                <label className={labelClass}>Upload ID Document Photograph</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-2xl hover:border-emerald-500 transition-colors bg-slate-50/50">
                  <div className="space-y-2 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label
                        htmlFor="id-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-emerald-600 hover:text-emerald-500 focus-within:outline-none"
                      >
                        <span>Upload a clear ID photo</span>
                        <input
                          id="id-upload"
                          name="id-upload"
                          data-testid="id-upload-input"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={handleIdFileChange}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-500">PNG, JPG, or WEBP up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {idPreviewUrl && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={idPreviewUrl}
                      alt="Uploaded ID preview"
                      className="w-16 h-12 object-cover rounded-lg border border-slate-300"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{idFile?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {((idFile?.size || 0) / 1024).toFixed(1)} KB &bull; Ready for OCR Scan
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIdFile(null);
                      setIdPreviewUrl(null);
                    }}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleScanId}
                disabled={!idFile || isScanningId}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isScanningId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning Document via OCR...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Scan & Process ID
                  </>
                )}
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3 & 4: FACE REGISTRATION & BIOMETRIC MATCHING PROMPT      */}
          {/* ============================================================== */}
          {(currentStep === 3 || currentStep === 4) && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm">Step 2 Complete: Government ID Scanned</h3>
                </div>
                <p className="text-xs text-emerald-800/80 leading-relaxed">
                  Extracted Identity: <span className="font-bold">{extractedData?.full_name}</span> (ID: {extractedData?.id_number_masked}).
                  Next, activate your device camera for real-time facial liveness capture.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="max-w-sm mx-auto">
                  <h4 className="font-bold text-slate-800 text-base">Face Registration & Capture</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Follow the on-screen prompts: look center, turn left, turn right, and blink to confirm live human presence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  disabled={isMatchingFace}
                  className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isMatchingFace ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Matching Face Against ID Photo...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Start Face Verification
                    </>
                  )}
                </button>
              </div>

              <FaceCaptureModal
                isOpen={isCameraModalOpen}
                onCapture={handleFaceCaptured}
                onClose={() => setIsCameraModalOpen(false)}
              />
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: PERSONAL INFORMATION REVIEW & ACCOUNT CREATION        */}
          {/* ============================================================== */}
          {currentStep === 5 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Biometric match confirmed ({((matchScore || 0.9) * 100).toFixed(0)}% confidence).
                  </span>
                </div>
                <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                  Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name (Extracted) */}
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className={labelClass}>
                    Full Name (Auto-Extracted from ID)
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={underlineInput}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Review and correct minor OCR typos if needed.
                  </p>
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dob" className={labelClass}>
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={underlineInput}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                {/* Calculated Age */}
                <div>
                  <label htmlFor="age" className={labelClass}>
                    Age (Calculated)
                  </label>
                  <input
                    id="age"
                    type="text"
                    readOnly
                    value={age}
                    className={`${underlineInput} bg-slate-100 font-bold`}
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    Address (from ID)
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={underlineInput}
                  />
                </div>

                {/* ID Number Masked */}
                <div className="sm:col-span-2">
                  <label htmlFor="residentId" className={labelClass}>
                    Verified Government ID Number
                  </label>
                  <input
                    id="residentId"
                    type="text"
                    readOnly
                    value={residentIdNum}
                    className={`${underlineInput} bg-slate-100 font-mono`}
                  />
                </div>

                {/* Purok / Area */}
                <div className="sm:col-span-2">
                  <label htmlFor="areaId" className={labelClass}>
                    Barangay Sabang Purok / Zone
                  </label>
                  <select
                    id="areaId"
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
                    className={underlineInput}
                  >
                    <option value="">Select your Purok</option>
                    {PUROK_OPTIONS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Email */}
                <div className="sm:col-span-2">
                  <label htmlFor="email" className={labelClass}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={underlineInput}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={underlineInput}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={underlineInput}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Privacy Consent (RA 10173) */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I acknowledge that my identity data is verified pursuant to Republic Act No. 10173 (Data Privacy Act of 2012) for Barangay Sabang municipal waste governance.
                  </span>
                </label>
              </div>

              {/* Final Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !fullName || !email || !acceptedPrivacy}
                className="w-full py-3.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Completing Verification & Registration...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Verified Registration
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 6: FINAL VERIFICATION RESULT                             */}
          {/* ============================================================== */}
          {currentStep === 6 && (
            <div className="p-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-700/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Identity Verification Complete!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your government ID and facial biometrics were verified successfully. Your resident account is now active.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
                >
                  Sign In to SABTRACK Portal
                </Link>
              </div>
            </div>
          )}

          {/* Footer link to Sign In */}
          <p className="text-xs text-slate-500 text-center mt-8">
            Already have an accredited resident account?{' '}
            <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
