import React from 'react';
import { LucideIcon, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  portalType: 'Resident Portal' | 'Barangay Administrative Portal';
  plannedPhase: string;
  description: string;
  features: string[];
  requiredPermission?: string;
  icon: LucideIcon;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  portalType,
  plannedPhase,
  description,
  features,
  requiredPermission,
  icon: Icon,
}) => {
  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-emerald-50 text-civic-forest rounded-xl flex-shrink-0">
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-civic-forest uppercase tracking-wider">
                {portalType}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                {plannedPhase}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-civic-slate mt-1 tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {requiredPermission && (
          <div className="md:text-right flex-shrink-0">
            <span className="inline-flex items-center text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-civic-forest" />
              {requiredPermission}
            </span>
          </div>
        )}
      </div>

      {/* Specification & Planned Deliverables Card */}
      <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider flex items-center">
          <CheckCircle2 className="w-4 h-4 text-civic-emerald mr-2" />
          Planned Operational Scope &amp; Deliverables
        </h3>
        
        <p className="text-xs text-slate-600 leading-relaxed">
          In strict compliance with our phase-gate methodology, this navigation view is scaffolded as an authorized architectural placeholder. Full domain tables, forms, and workflows will be activated upon client validation and phase approval.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5 text-xs text-slate-700"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-civic-forest mt-1.5 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
