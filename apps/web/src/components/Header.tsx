'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Leaf,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
  Menu,
  X,
  UserPlus,
  HelpCircle,
  PhoneCall,
  Home as HomeIcon,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#edf2f7]/95 backdrop-blur-md border-b border-white/80 shadow-neu-sm transition-all">
      {/* Main Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo with tactile extruded icon */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-neu-green flex items-center justify-center group-hover:scale-105 transition-all">
            <Leaf className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                SABTRACK
              </span>
              <span className="neu-chip bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200/50">
                3.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Barangay Sabang &bull; Lipa City
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links: HOME, ABOUT, CONTACT US (visible for visitors/residents) */}
        {!isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-3">
            <Link
              href="/#home"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:shadow-neu-sm transition-all uppercase tracking-wider"
            >
              HOME
            </Link>
            <Link
              href="/#about"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:shadow-neu-sm transition-all uppercase tracking-wider"
            >
              ABOUT
            </Link>
            <Link
              href="/#contact"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:shadow-neu-sm transition-all uppercase tracking-wider"
            >
              CONTACT US
            </Link>
          </nav>
        )}

        {/* Right Action Controls: REGISTER & LOGIN (or Portals if logged in) */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {['RESIDENT', 'BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                <Link
                  href="/resident"
                  className="neu-btn-secondary inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800"
                >
                  <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  <span>Resident Portal</span>
                </Link>
              )}

              {['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                <Link
                  href="/admin"
                  className="neu-btn-secondary inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700"
                >
                  <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                  <span>Admin Console</span>
                </Link>
              )}

              {/* User Identity Chip: Privacy-preserving role indicator */}
              <div className="hidden lg:flex items-center space-x-2 pl-2">
                <div className="neu-chip px-3 py-1 rounded-xl text-right">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={() => logout()}
                disabled={loading}
                aria-label="Sign out of SABTRACK"
                className="neu-btn-secondary inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                <span>SIGN OUT</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/register"
                className="neu-btn-secondary inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 uppercase tracking-wider"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                <span>REGISTER</span>
              </Link>
              <Link
                href="/login"
                className="neu-btn-primary inline-flex items-center px-5 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                <span>LOGIN</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="neu-btn-secondary p-2.5 rounded-xl text-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/60 bg-[#edf2f7] px-4 pt-3 pb-5 space-y-2 shadow-neu-raised">
          {!isAuthenticated && (
            <>
              <Link
                href="/#home"
                onClick={() => setMobileMenuOpen(false)}
                className="neu-card-interactive flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 uppercase"
              >
                <HomeIcon className="w-4 h-4 text-emerald-600" />
                <span>HOME</span>
              </Link>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="neu-card-interactive flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 uppercase"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>ABOUT</span>
              </Link>
              <Link
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="neu-card-interactive flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 uppercase"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>CONTACT US</span>
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-slate-200/60 space-y-2">
            {isAuthenticated && user ? (
              <>
                {['RESIDENT', 'BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                  <Link
                    href="/resident"
                    onClick={() => setMobileMenuOpen(false)}
                    className="neu-btn-secondary flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Resident Portal</span>
                  </Link>
                )}
                {['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="neu-btn-secondary flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <ShieldAlert className="w-4 h-4 text-slate-600" />
                    <span>Admin Console</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full neu-btn-secondary flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>SIGN OUT</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="neu-btn-secondary flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 uppercase"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>REGISTER</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="neu-btn-primary flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-white uppercase"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>LOGIN</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
