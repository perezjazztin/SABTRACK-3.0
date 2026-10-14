'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/auth';
import { ShieldAlert, Lock, LogIn, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string;
  moduleName?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  moduleName = 'Protected Module',
}) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-civic-emeraldLight border-t-civic-forest rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Verifying session credentials and permissions...
        </p>
      </div>
    );
  }

  // Case 1: Unauthenticated user
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-civic-border p-8 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 text-civic-forest rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-civic-slate">
          Authentication Required
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The <span className="font-semibold text-slate-700">{moduleName}</span> is restricted to verified Barangay Sabang community members and authorized personnel.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in to Your Account
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: Role check failed
  if (requiredRole && !hasRole(requiredRole)) {
    const rolesStr = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-rose-600">
          <div className="p-2.5 bg-rose-100 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900">
              403 — Access Forbidden
            </h3>
            <p className="text-xs text-rose-600">
              Least-privilege Role-Based Access Control enforced
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 space-y-2">
          <p>
            Your current account (<span className="font-mono font-semibold">{user.email}</span>) holds the role <span className="font-mono font-semibold">{user.role}</span>.
          </p>
          <p>
            Viewing the <span className="font-semibold">{moduleName}</span> requires role authorization: <span className="font-mono font-semibold text-rose-900">{rolesStr}</span>.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href={user.role === 'RESIDENT' ? '/resident' : '/admin'}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Return to Authorized Portal
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  // Case 3: Specific permission check failed
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-amber-200 p-8 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-amber-700">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900">
              403 — Missing Permission
            </h3>
            <p className="text-xs text-amber-700">
              Required capability: <code className="font-mono">{requiredPermission}</code>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your role does not possess the explicit permission required to perform actions in <span className="font-semibold">{moduleName}</span>.
        </p>

        <div className="pt-2">
          <Link
            href={user.role === 'RESIDENT' ? '/resident' : '/admin'}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Return to Authorized Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
