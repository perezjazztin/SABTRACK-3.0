'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Leaf, Activity, LogIn, LogOut, User, Shield, ShieldAlert } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();

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
              Official Solid Waste Management Portal
            </span>
          </div>
          <div className="flex items-center space-x-3 text-emerald-100">
            <span className="hidden md:inline">Republic Act 9003 — Ecological Solid Waste Management</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-civic-forest text-white p-2.5 rounded-lg shadow-sm flex items-center justify-center group-hover:bg-civic-forestHover transition-colors">
            <Leaf className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-civic-slate tracking-tight">
                SABTRACK
              </h1>
              <span className="bg-civic-emeraldLight text-civic-forest font-semibold text-xs px-2 py-0.5 rounded">
                3.0 RBAC
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Solid Waste Management, Community Reporting &amp; Analytics
            </p>
          </div>
        </Link>

        {/* Navigation & Auth Actions */}
        <nav className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href="/"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-civic-forest hover:bg-slate-50 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 mr-1.5 text-civic-emerald" />
            <span className="hidden sm:inline">System Diagnostics</span>
          </Link>

          {/* If Authenticated: Show Portal Navigation and User Info */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Portal Links */}
              {['RESIDENT', 'BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                <Link
                  href="/resident"
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-civic-forest bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <User className="w-3.5 h-3.5 mr-1 text-civic-forest" />
                  <span>Resident Portal</span>
                </Link>
              )}

              {['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 text-slate-700" />
                  <span>Admin Console</span>
                </Link>
              )}

              {/* User Identity Chip */}
              <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {user.role}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => logout()}
                disabled={loading}
                aria-label="Sign out of SABTRACK"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 mr-1 text-rose-600" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            /* If Unauthenticated: Sign In Button */
            <Link
              href="/login"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              <span>Sign In</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
