import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-civic-slate text-slate-300 border-t border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          {/* Column 1: Academic Identity */}
          <div>
            <h3 className="text-white font-semibold text-base mb-2">
              SABTRACK 3.0 Platform
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              An academic digital governance system supporting garbage collection scheduling,
              verified community reporting, citizen engagement, and administrative analytics.
            </p>
            <div className="text-[11px] text-emerald-400 font-mono">
              Course: IT 313 — System Analysis and Design
            </div>
            <div className="text-[11px] text-slate-400">
              Batangas State University – The NEU, Lipa Campus
            </div>
          </div>

          {/* Column 2: Proponents & Client */}
          <div>
            <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-2">
              Project Team & Partner LGU
            </h4>
            <div className="text-xs space-y-1 mb-3">
              <p className="text-slate-200">
                <span className="text-slate-400">Proponents:</span> Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano
              </p>
              <p className="text-slate-200">
                <span className="text-slate-400">Partner:</span> Barangay Sabang (Barangay Council / LGU)
              </p>
              <p className="text-slate-200">
                <span className="text-slate-400">Location:</span> Lipa City, Batangas, Philippines
              </p>
            </div>
          </div>

          {/* Column 3: Academic & Research Integrity Notice */}
          <div>
            <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-2">
              Research & Ethics Baseline
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official Academic Title: <br />
              <span className="italic text-slate-300">
                &ldquo;SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling,
                Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang&rdquo;
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Demonstration data shown in development is synthetic. Field operations and boundary structures are subject to barangay validation.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700/60 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div>
            &copy; 2026 SABTRACK Development Team. Built for civic environmental stewardship.
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span className="text-emerald-400">FastAPI</span>
            <span>&bull;</span>
            <span className="text-emerald-400">Next.js</span>
            <span>&bull;</span>
            <span className="text-emerald-400">PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
