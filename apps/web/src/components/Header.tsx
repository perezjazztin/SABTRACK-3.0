'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { RealTimeClock } from '@/components/RealTimeClock';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, loading, isLoggingOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutStep, setSignOutStep] = useState<'closing' | 'done'>('closing');
  const router = useRouter();
  const pathname = usePathname() || '';
  const isTimeHidden =
    pathname === '/' ||
    pathname === '' ||
    pathname.startsWith('/#') ||
    pathname === '/login' ||
    pathname.startsWith('/login') ||
    pathname === '/register' ||
    pathname.startsWith('/register');

  const handleLogout = async () => {
    setIsSigningOut(true);
    setSignOutStep('closing');
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }

    // Brief, snappy visual feedback on opaque white screen
    if (!isTest) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // Transition to completed state and navigate to home behind the white screen
    setSignOutStep('done');
    router.push('/');
    if (typeof router.refresh === 'function') {
      router.refresh();
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }

    // Hold white screen briefly (180ms) while home page mounts invisibly
    if (!isTest) {
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    setIsSigningOut(false);
    setSignOutStep('closing');
  };

  const isProcessingSignOut = isSigningOut;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#f4f8f5]/90 backdrop-blur-md border-b border-slate-200/60 shadow-neu-xs transition-all">
        {/* Main Navigation Bar */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
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

          {/* Right Action Controls: Real-Time Clock (hidden on landing page), REGISTER & LOGIN (or Portals if logged in) */}
          <div className="hidden md:flex items-center space-x-3">
            {!isTimeHidden && <RealTimeClock />}

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Strict Role Isolation: RESIDENT only navigates to Resident Portal */}
                {user.role === 'RESIDENT' && (
                  <Link
                    href="/resident"
                    className="neu-btn-secondary inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800"
                  >
                    <User className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    <span>Resident Portal</span>
                  </Link>
                )}

                {/* Strict Role Isolation: STAFF navigates to Staff Console, ADMIN to Admin Console */}
                {['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                  <Link
                    href="/admin"
                    className="neu-btn-secondary inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                    <span>{user.role === 'BARANGAY_STAFF' ? 'Staff Console' : 'Admin Console'}</span>
                  </Link>
                )}

                {/* System Maintainer: Dedicated diagnostics/maintainer indicator */}
                {user.role === 'SYSTEM_MAINTAINER' && (
                  <div className="neu-chip inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700">
                    <Wrench className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                    <span>System Maintainer</span>
                  </div>
                )}

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading || isProcessingSignOut}
                  aria-label="Sign out of SABTRACK"
                  className="neu-btn-secondary inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 transition-colors disabled:opacity-50"
                >
                  {isProcessingSignOut ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mr-1.5" />
                      <span>SIGNING OUT...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                      <span>SIGN OUT</span>
                    </>
                  )}
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
          <div className="md:hidden border-t border-slate-200/60 bg-white px-4 pt-3 pb-5 space-y-2.5 shadow-neu-raised">
            {!isTimeHidden && (
              <div className="pb-1 flex justify-center">
                <RealTimeClock className="w-full justify-center" />
              </div>
            )}
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
                  {user.role === 'RESIDENT' && (
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
                      <span>{user.role === 'BARANGAY_STAFF' ? 'Staff Console' : 'Admin Console'}</span>
                    </Link>
                  )}
                  {user.role === 'SYSTEM_MAINTAINER' && (
                    <div className="neu-chip flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700">
                      <Wrench className="w-4 h-4 text-slate-500" />
                      <span>System Maintainer</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await handleLogout();
                    }}
                    disabled={loading || isProcessingSignOut}
                    className="w-full neu-btn-secondary flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 disabled:opacity-50"
                  >
                    {isProcessingSignOut ? (
                      <>
                        <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mr-1.5" />
                        <span>SIGNING OUT...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>SIGN OUT</span>
                      </>
                    )}
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

      {/* Full-screen opaque white screen sign out transition */}
      {isProcessingSignOut && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 select-none"
        >
          <div className="flex flex-col items-center justify-center space-y-4 max-w-xs text-center animate-in fade-in duration-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              {signOutStep === 'done' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 animate-in zoom-in-75 duration-100" />
              ) : (
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase">
                {signOutStep === 'done' ? 'Signed Out' : 'Signing Out...'}
              </h3>
              <p className="text-xs text-slate-400">
                Barangay Sabang Civic Portal
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
