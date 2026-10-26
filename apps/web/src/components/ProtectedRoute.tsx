'use client';

import React, { useState } from 'react';
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
  const { user, loading, isLoggingOut, isAuthenticated, hasRole, hasPermission, logout } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleSwitchAccount = async () => {
    setSwitching(true);
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error during account switch:', err);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/register';
    }
  };

  if (loading || isLoggingOut) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-civic-emeraldLight border-t-civic-forest rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          {isLoggingOut ? 'Signing out securely...' : 'Verifying session credentials and permissions...'}
        </p>
      </div>
    );
  }

  // Case 1: Unauthenticated user
  if (!isAuthenticated || !user) {
    return (
      <div className="neu-card max-w-md mx-auto my-12 rounded-3xl border border-emerald-900/10 p-8 shadow-neu-raised text-center space-y-4">
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
            className="neu-btn-primary inline-flex items-center justify-center w-full px-5 py-3 rounded-xl text-xs font-bold text-white shadow-neu-green transition-all"
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
      <div className="neu-card max-w-lg mx-auto my-12 rounded-3xl border border-rose-200 p-8 shadow-neu-raised space-y-4">
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
            className="neu-btn-secondary w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            Return to Authorized Portal
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
          <button
            type="button"
            onClick={handleSwitchAccount}
            disabled={switching}
            className="neu-btn-primary w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-neu-green transition-all disabled:opacity-50"
          >
            {switching ? 'Signing out...' : 'Switch Account'}
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Specific permission check failed
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="neu-card max-w-lg mx-auto my-12 rounded-3xl border border-amber-200 p-8 shadow-neu-raised space-y-4">
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

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href={user.role === 'RESIDENT' ? '/resident' : '/admin'}
            className="neu-btn-secondary w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all"
          >
            Return to Authorized Dashboard
          </Link>
          <button
            type="button"
            onClick={handleSwitchAccount}
            disabled={switching}
            className="neu-btn-primary w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-neu-green transition-all disabled:opacity-50"
          >
            {switching ? 'Signing out...' : 'Switch Account'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
