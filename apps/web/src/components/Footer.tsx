'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, GraduationCap, Users, ShieldCheck, MapPin } from 'lucide-react';
export { DashboardFooter } from './DashboardFooter';

export const Footer: React.FC = () => {
  const pathname = usePathname() || '';
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/resident');

  // User dashboards have their own minimal neumorphic DashboardFooter embedded directly into their layouts
  if (isDashboard) {
    return null;
  }

  return (
    <footer className="mt-auto relative overflow-hidden bg-gradient-to-b from-[#064e3b] via-[#043327] to-[#021f17] text-emerald-100 border-t border-emerald-500/30 shadow-2xl transition-all">
      {/* Ambient background glow accents for modern non-plain depth */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"
      />

      {/* Luminous top accent gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-teal-400/20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Column 1: Academic Identity & Platform Vision */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 ring-1 ring-white/20 flex-shrink-0">
                  <Leaf className="w-5 h-5 text-emerald-50" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base tracking-tight">
                    SABTRACK 3.0 Platform
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Civic Solid Waste Governance
                  </span>
                </div>
              </div>
              <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
                A digital governance platform designed for automated collection scheduling,
                verified resident violation reporting, and gamified solid waste stewardship.
              </p>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-4 border border-emerald-500/20 shadow-inner space-y-1.5 hover:border-emerald-400/40 transition-colors">
              <div className="text-[11px] font-bold text-emerald-300 flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Course: IT 313 — System Analysis and Design</span>
              </div>
              <div className="text-[11px] text-emerald-200/70 pl-6">
                Batangas State University – The NEU, Lipa Campus
              </div>
            </div>
          </div>

          {/* Column 2: Proponents & Client Partner */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Project Team &amp; Partner LGU</span>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-4 border border-emerald-500/20 shadow-inner space-y-1.5 hover:border-emerald-400/40 transition-colors">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Proponents
                </div>
                <div className="text-xs text-white font-medium leading-relaxed">
                  Jazztin H. Perez &bull; Faith A. Valencia &bull; May Sigrid M. Dimaano
                </div>
              </div>
            </div>

            <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-4 border border-emerald-500/20 shadow-inner text-xs text-emerald-200/90 flex items-start space-x-2.5 hover:border-emerald-400/40 transition-colors">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-emerald-300 font-bold">LGU Partner:</span>{' '}
                <p className="text-white font-medium">Barangay Sabang Council</p>
                <p className="text-emerald-300/70 text-[11px]">Lipa City, Batangas, Philippines</p>
              </div>
            </div>
          </div>

          {/* Column 3: Academic & Research Integrity Notice */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Academic &amp; Research Baseline</span>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-4 border-l-4 border-l-emerald-400 border-y border-r border-emerald-500/20 text-xs text-emerald-100/90 italic leading-relaxed shadow-inner hover:border-emerald-400/40 transition-colors">
                &ldquo;SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling,
                Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang&rdquo;
              </div>
            </div>

            <div className="bg-emerald-950/70 rounded-2xl p-3 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center space-x-2.5 shadow-sm">
              <span className="flex h-2 w-2 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>RA 9003 Solid Waste &amp; RA 10173 Data Privacy Act Compliant</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Modern Tech Badges */}
        <div className="border-t border-emerald-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/70 gap-4">
          <div className="text-center sm:text-left font-medium">
            &copy; 2026 SABTRACK Development Team. Built for Barangay Sabang environmental stewardship.
          </div>
          <div className="flex items-center space-x-2.5 text-[11px]">
            <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-mono font-semibold shadow-sm hover:border-emerald-400 transition-colors">
              FastAPI
            </span>
            <span className="text-emerald-500/60">&bull;</span>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-mono font-semibold shadow-sm hover:border-emerald-400 transition-colors">
              Next.js
            </span>
            <span className="text-emerald-500/60">&bull;</span>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-mono font-semibold shadow-sm hover:border-emerald-400 transition-colors">
              PostgreSQL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
