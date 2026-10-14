'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { User, Shield, Mail, Calendar, MapPin } from 'lucide-react';

export default function ResidentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-100 text-civic-forest rounded-2xl flex items-center justify-center font-bold text-xl">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-civic-slate">{user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-civic-forest border border-emerald-200">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role}
              </span>
              <span className="text-[11px] text-slate-400">
                Account Active &bull; Philippine RA 10173 Protected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-civic-border p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-civic-slate uppercase tracking-wider">
          Account &amp; Residency Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Email Address</span>
              <p className="font-semibold text-slate-800">{user?.email}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Assigned Area</span>
              <p className="font-semibold text-slate-800">
                {user?.area_id ? `Area ID #${user.area_id}` : 'Barangay Sabang (General)'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Member Since</span>
              <p className="font-semibold text-slate-800">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <Shield className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Access Permissions</span>
              <p className="font-semibold text-slate-800">Standard Resident Role</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
