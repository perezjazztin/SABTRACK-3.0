import React from 'react';
import { HealthDashboard } from '@/components/HealthDashboard';
import { Layers, Database, Globe, Compass, ShieldAlert, Cpu } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Civic Hero Section */}
      <section className="bg-gradient-to-r from-civic-forest to-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-medium backdrop-blur-sm">
            <Globe className="w-3.5 h-3.5 mr-1.5 text-emerald-300" />
            Barangay Sabang Solid Waste Management Initiative
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Digital Governance Platform &amp; Analytics Foundation
          </h2>

          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
            SABTRACK 3.0 provides centralized garbage collection scheduling, geo-tagged community violation reporting, verified resident participation, and an executive analytics procedure for Barangay Sabang officials.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-black/25 px-2.5 py-1 rounded text-emerald-100 border border-white/10">
              IT 313 NEU Project
            </span>
            <span className="bg-black/25 px-2.5 py-1 rounded text-emerald-100 border border-white/10">
              Modular Monolith
            </span>
            <span className="bg-black/25 px-2.5 py-1 rounded text-emerald-100 border border-white/10">
              Phase 1 Runnable Foundation
            </span>
          </div>
        </div>

        {/* Decorative backdrop elements */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Real-time Diagnostics Dashboard */}
      <section>
        <HealthDashboard />
      </section>

      {/* Architectural Principles & Technology Highlights */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-civic-slate">
          Engineering Architecture &amp; Governance Guardrails
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-civic-border shadow-sm space-y-2">
            <div className="p-2 w-fit rounded-lg bg-emerald-50 text-civic-forest">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-civic-slate">Modular Monolith</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              FastAPI backend cleanly segmented into cohesive domain modules (auth, reports, schedules, points, analytics) sharing one ACID transactional database.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-civic-border shadow-sm space-y-2">
            <div className="p-2 w-fit rounded-lg bg-emerald-50 text-civic-forest">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-civic-slate">PostgreSQL Primary</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Targeted for production and development. Schema migrations managed through Alembic with version-controlled evolution and relational constraints.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-civic-border shadow-sm space-y-2">
            <div className="p-2 w-fit rounded-lg bg-emerald-50 text-civic-forest">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-civic-slate">Privacy &amp; Data Ethics</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Philippine Data Privacy Act (RA 10173) compliant: resident PII minimized, image uploads stored in private storage, and EXIF coordinates sanitized.
            </p>
          </div>
        </div>
      </section>

      {/* Field Validation Notice */}
      <section className="p-5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
        <Compass className="w-5 h-5 text-civic-forest flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-800">
            Field Research &amp; Operational Boundaries
          </h4>
          <p className="leading-relaxed">
            In accordance with our research integrity protocol, present-day Barangay Sabang collection schedules, truck routes, and administrative personnel workflows remain subject to formal field validation. No operational assumptions are hardcoded into production schemas.
          </p>
        </div>
      </section>
    </div>
  );
}
