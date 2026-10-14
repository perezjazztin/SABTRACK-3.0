import React from 'react';
import { Leaf, ShieldCheck, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-civic-border bg-white shadow-sm sticky top-0 z-50">
      {/* Top Civic Identity Bar */}
      <div className="bg-civic-forest text-white px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              Barangay Sabang, Lipa City, Batangas
            </span>
            <span className="text-emerald-200 hidden sm:inline">|</span>
            <span className="text-emerald-200 hidden sm:inline">
              IT 313 — System Analysis and Design
            </span>
          </div>
          <div className="flex items-center space-x-3 text-emerald-100">
            <span className="hidden md:inline">SDG 11: Sustainable Communities</span>
            <span className="bg-civic-emerald/30 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono">
              v3.0.0 (Phase 1)
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-civic-forest text-white p-2.5 rounded-lg shadow-sm flex items-center justify-center">
            <Leaf className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-civic-slate tracking-tight">
                SABTRACK
              </h1>
              <span className="bg-civic-emeraldLight text-civic-forest font-semibold text-xs px-2 py-0.5 rounded">
                3.0 Foundation
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Solid Waste Management, Community Reporting & Analytics
            </p>
          </div>
        </div>

        {/* Phase Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-civic-forest border border-emerald-200">
            <Activity className="w-3.5 h-3.5 mr-1.5 text-civic-emerald" />
            Diagnostic Dashboard
          </span>
          <span className="hidden md:inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-normal text-slate-400 border border-dashed border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Modules (Phase 2+)
          </span>
        </nav>
      </div>
    </header>
  );
};
