'use client';

import React, { useState, useEffect } from 'react';
import {
  Leaf,
  HelpCircle,
  ShieldCheck,
  X,
  Phone,
  Mail,
  Clock,
  MapPin,
} from 'lucide-react';

export interface DashboardFooterProps {
  className?: string;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({ className = '' }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHelpOpen(false);
        setPrivacyOpen(false);
      }
    };

    if (helpOpen || privacyOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [helpOpen, privacyOpen]);

  return (
    <>
      <footer
        className={`w-full mt-auto border-t border-slate-200/70 bg-white/95 backdrop-blur-sm py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 shadow-[0_-2px_8px_rgba(163,177,198,0.18)] transition-all ${className}`}
        data-testid="dashboard-footer"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          {/* Left: Brand, Version & Copyright */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-neu-xs flex-shrink-0">
                <Leaf className="w-3 h-3 text-emerald-100" />
              </div>
              <span className="tracking-tight text-slate-900 font-extrabold">SABTRACK</span>
            </div>

            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50/90 text-emerald-800 border border-emerald-200/60 font-mono text-[10px] font-bold">
              v3.0.0
            </span>

            <span className="hidden sm:inline text-slate-300 font-bold">&bull;</span>

            <span className="text-[11px] text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Barangay Sabang. All rights reserved.
            </span>
          </div>

          {/* Right: Help & Support and Privacy Policy Links */}
          <div className="flex items-center space-x-4 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center space-x-1 text-slate-600 hover:text-emerald-700 transition-colors py-1 focus-visible:outline-emerald-600"
              aria-label="Open Help & Support dialog"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Help &amp; Support</span>
            </button>

            <span className="text-slate-300 font-bold">&bull;</span>

            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="inline-flex items-center space-x-1 text-slate-600 hover:text-emerald-700 transition-colors py-1 focus-visible:outline-emerald-600"
              aria-label="Open Privacy Policy dialog"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Privacy Policy</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Help & Support Accessible Modal */}
      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-support-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHelpOpen(false);
          }}
        >
          <div className="neu-card w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-200/70 shadow-neu-raised max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-neu-xs">
                  <HelpCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 id="help-support-title" className="text-base font-extrabold text-slate-900">
                    Help &amp; Support
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Barangay Sabang Solid Waste Management Desk
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="neu-button p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Close Help & Support dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Assistance Contact Cards */}
            <div className="space-y-2.5 text-xs">
              <div className="neu-socket p-3 rounded-2xl flex items-start space-x-3 border border-emerald-900/5">
                <Phone className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Hotline Assistance</span>
                  <span className="text-slate-600 font-mono text-[11px]">(043) 784-2190 &bull; +63 917 842 1900</span>
                </div>
              </div>

              <div className="neu-socket p-3 rounded-2xl flex items-start space-x-3 border border-emerald-900/5">
                <Mail className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Support Email</span>
                  <span className="text-slate-600 text-[11px]">swmo@sabtrack.lipa.gov.ph</span>
                </div>
              </div>

              <div className="neu-socket p-3 rounded-2xl flex items-start space-x-3 border border-emerald-900/5">
                <Clock className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Office Hours</span>
                  <span className="text-slate-600 text-[11px]">Monday &ndash; Friday: 8:00 AM &ndash; 5:00 PM</span>
                </div>
              </div>

              <div className="neu-socket p-3 rounded-2xl flex items-start space-x-3 border border-emerald-900/5">
                <MapPin className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Barangay Hall</span>
                  <span className="text-slate-600 text-[11px]">Barangay Sabang Council, Lipa City, Batangas 4217</span>
                </div>
              </div>
            </div>

            {/* Guidance Box */}
            <div className="neu-socket-green p-3.5 rounded-2xl text-[11px] text-emerald-900 space-y-1">
              <span className="font-bold block">Need Assistance with Schedules or Reports?</span>
              <p className="text-emerald-800/90 leading-relaxed font-medium">
                For missed garbage pickups or urgent waste incident inquiries, submit a report via <strong>My Reports</strong> or reach out to the Barangay Desk during office hours.
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Accessible Modal */}
      {privacyOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-policy-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPrivacyOpen(false);
          }}
        >
          <div className="neu-card w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-200/70 shadow-neu-raised max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-neu-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 id="privacy-policy-title" className="text-base font-extrabold text-slate-900">
                    Data Privacy Policy
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Republic Act No. 10173 &bull; Data Privacy Act of 2012
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="neu-button p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Close Privacy Policy dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="neu-socket p-3.5 rounded-2xl space-y-1.5 border border-emerald-900/5">
                <span className="font-bold text-slate-900 block text-xs">
                  1. Purpose &amp; Scope of Data Collection
                </span>
                <p className="text-[11px] text-slate-600">
                  SABTRACK processes user identity details exclusively for municipal waste collection scheduling, verified community incident reporting, and civic stewardship rewards in Barangay Sabang.
                </p>
              </div>

              <div className="neu-socket p-3.5 rounded-2xl space-y-1.5 border border-emerald-900/5">
                <span className="font-bold text-slate-900 block text-xs">
                  2. EXIF &amp; GPS Telemetry Sanitization
                </span>
                <p className="text-[11px] text-slate-600">
                  In strict compliance with RA 10173, all user-submitted incident photos undergo automatic sanitization upon upload to strip embedded EXIF camera telemetry and device identifiers.
                </p>
              </div>

              <div className="neu-socket p-3.5 rounded-2xl space-y-1.5 border border-emerald-900/5">
                <span className="font-bold text-slate-900 block text-xs">
                  3. Role-Based Confidentiality &amp; Integrity
                </span>
                <p className="text-[11px] text-slate-600">
                  Personal reports are accessible only to authorized Barangay Staff and Administrators. Unauthorized personnel are strictly sequestered from confidential resident information.
                </p>
              </div>
            </div>

            <div className="neu-socket-green p-3 rounded-2xl text-[11px] text-emerald-900">
              <span className="font-bold">Barangay Data Protection Officer:</span>{' '}
              <span className="font-medium">swmo@sabtrack.lipa.gov.ph &bull; Barangay Sabang Council</span>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setPrivacyOpen(false)}
                className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
