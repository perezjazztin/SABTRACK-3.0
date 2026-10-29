'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  Leaf,
  LogIn,
  LogOut,
  User,
  ShieldAlert,
  Menu,
  X,
  UserPlus,
  Home as HomeIcon,
  Compass,
  Globe2,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { RealTimeClock } from '@/components/RealTimeClock';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });
const body = Figtree({ subsets: ['latin'], variable: '--font-body' });

const D = 'font-[family-name:var(--font-display)]';
const ring = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40';

const NAV = [
  { label: 'Home', id: 'home', href: '/#home', icon: HomeIcon },
  { label: 'How it works', id: 'how-it-works', href: '/#how-it-works', icon: Compass },
  { label: 'About', id: 'about', href: '/#about', icon: Globe2 },
  { label: 'Contact', id: 'contact', href: '/#contact', icon: PhoneCall },
];

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutStep, setSignOutStep] = useState<'closing' | 'done'>('closing');
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState('home');
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname() || '';

  const isAuthPage =
    pathname === '/login' ||
    pathname.startsWith('/login') ||
    pathname === '/register' ||
    pathname.startsWith('/register');
  const isLanding = pathname === '' || pathname === '/' || pathname.startsWith('/#');
  const isTimeHidden = isLanding || isAuthPage;
  const isOverlayPage = isLanding || isAuthPage;

  /* Scroll state: shadow + thin reading-progress line */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 8);
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  /* Track which landing-page section is in view */
  useEffect(() => {
    if (!isLanding || typeof IntersectionObserver === 'undefined') return;
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveId(e.target.id)),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isLanding]);

  /* Position the sliding indicator behind the active nav link */
  useEffect(() => {
    if (!isLanding || isAuthenticated) {
      setPill(null);
      return;
    }
    const measure = () => {
      const el = navRef.current?.querySelector<HTMLElement>(`[data-nav="${activeId}"]`);
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeId, isLanding, isAuthenticated]);

  /* Close the mobile menu on navigation or Escape */
  useEffect(() => setMobileMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

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
  const portalLabel = user?.role === 'BARANGAY_STAFF' ? 'Staff Console' : 'Admin Console';

  return (
    <>
      <style>{`
        @keyframes sabMenu{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
        .sab-menu{animation:sabMenu .22s cubic-bezier(.2,.7,.2,1) both;transform-origin:top center}
        @media (prefers-reduced-motion:reduce){.sab-menu{animation:none}}
      `}</style>

      <header
        className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] z-50 w-full transition-all ${isOverlayPage ? 'sticky top-3 sm:top-4 px-3 sm:px-6 lg:px-8 pointer-events-none -mb-[68px] sm:-mb-[76px]' : 'sticky top-0'
          }`}
      >
        {/* Standard box with a simple hairline border */}
        <div
          className={`${isOverlayPage ? 'max-w-6xl mx-auto rounded-xl p-px bg-slate-200/80 pointer-events-auto' : 'w-full'} transition-shadow duration-300 motion-reduce:transition-none ${scrolled ? (isOverlayPage ? 'shadow-2xl shadow-emerald-900/15' : 'shadow-md shadow-slate-900/10') : (isOverlayPage ? 'shadow-lg shadow-slate-900/5' : '')
            }`}
        >
          <div className={`relative backdrop-blur-xl flex items-center justify-between gap-3 py-2.5 ${isOverlayPage ? 'rounded-[11px] bg-white/90 px-3 sm:px-4' : 'bg-white/95 border-b border-slate-200 px-4 sm:px-6 lg:px-8'}`}>
            {/* Brand */}
            <Link href="/" aria-label="SABTRACK home" className={`group flex items-center gap-2.5 sm:gap-3 rounded-lg pr-2 ${ring}`}>
              <span className="relative grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-700 to-emerald-900 text-white shadow-md shadow-emerald-700/30 group-hover:rotate-[-6deg] transition-transform motion-reduce:transition-none flex-shrink-0">
                <Leaf className="w-5 h-5 text-lime-200" aria-hidden="true" />
                <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-lime-300 ring-2 ring-white" />
              </span>
              <span className="leading-none">
                <span className="flex items-center gap-1.5">
                  <span className={`${D} text-lg sm:text-xl font-extrabold tracking-[-0.03em] text-slate-900`}>SABTRACK</span>
                  <span className="bg-lime-300 text-emerald-950 font-extrabold text-[10px] px-2 py-0.5 rounded-md">3.0</span>
                </span>
                <span className="hidden sm:block mt-1 text-[11px] text-slate-500 font-medium">
                  Barangay Sabang &bull; Lipa City
                </span>
              </span>
            </Link>

            {/* Desktop navigation with sliding indicator (visitors only) */}
            {!isAuthenticated && (
              <nav
                ref={navRef}
                aria-label="Primary"
                className="relative hidden md:flex items-center gap-0.5 rounded-lg bg-slate-100/80 border border-slate-200/70 p-1"
              >
                {pill && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 rounded-md bg-white shadow-sm shadow-slate-900/10 ring-1 ring-slate-200/70 transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
                    style={{ left: pill.left, width: pill.width }}
                  />
                )}
                {NAV.map((n) => {
                  const active = isLanding && activeId === n.id;
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      data-nav={n.id}
                      aria-current={active ? 'location' : undefined}
                      className={`relative z-10 px-4 py-2 rounded-md text-sm font-bold transition-colors motion-reduce:transition-none ${ring} ${active ? 'text-emerald-800' : 'text-slate-600 hover:text-emerald-700'
                        }`}
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              {!isTimeHidden && <RealTimeClock />}

              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  {/* Strict role isolation: RESIDENT only navigates to Resident Portal */}
                  {user.role === 'RESIDENT' && (
                    <Link
                      href="/resident"
                      className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors ${ring}`}
                    >
                      <User className="w-4 h-4 mr-1.5 text-emerald-600" aria-hidden="true" />
                      Resident Portal
                    </Link>
                  )}

                  {/* STAFF navigates to Staff Console, ADMIN to Admin Console */}
                  {['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                    <Link
                      href="/admin"
                      className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors ${ring}`}
                    >
                      <ShieldAlert className="w-4 h-4 mr-1.5 text-slate-600" aria-hidden="true" />
                      {portalLabel}
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loading || isProcessingSignOut}
                    aria-label="Sign out of SABTRACK"
                    className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-50 ${ring}`}
                  >
                    {isProcessingSignOut ? (
                      <>
                        <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin motion-reduce:animate-none mr-1.5" aria-hidden="true" />
                        Signing out…
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-1.5 text-rose-600" aria-hidden="true" />
                        Sign out
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/register"
                    className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors ${ring}`}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5 text-emerald-600" aria-hidden="true" />
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className={`group inline-flex items-center pl-5 pr-4 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 shadow-md shadow-emerald-700/30 transition-colors ${ring}`}
                  >
                    Login
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                className={`grid h-10 w-10 place-items-center rounded-lg text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors ${ring}`}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>

            {/* Reading progress */}
            {scrolled && (
              <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-[3px] overflow-hidden ${isOverlayPage ? 'rounded-b-[11px]' : ''}`}>
                <span
                  className="block h-full bg-gradient-to-r from-emerald-500 to-lime-400"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
            )}
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className={`sab-menu md:hidden ${isOverlayPage ? 'mt-2 max-w-6xl mx-auto rounded-xl border' : 'rounded-none border-x-0 border-b'} border-slate-200 bg-white/95 backdrop-blur-xl p-4 space-y-3 shadow-2xl shadow-emerald-900/15 pointer-events-auto`}
          >
            {!isTimeHidden && (
              <div className="flex justify-center">
                <RealTimeClock className="w-full justify-center" />
              </div>
            )}

            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-2.5">
                {NAV.map((n) => {
                  const active = isLanding && activeId === n.id;
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={active ? 'location' : undefined}
                      className={`flex flex-col gap-2 p-3.5 rounded-xl border text-sm font-bold transition-colors ${ring} ${active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-700 border border-slate-200'}`}>
                        <n.icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              {isAuthenticated && user ? (
                <>
                  {user.role === 'RESIDENT' && (
                    <Link
                      href="/resident"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 ${ring}`}
                    >
                      <User className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      Resident Portal
                    </Link>
                  )}
                  {['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(user.role) && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 border border-slate-200 ${ring}`}
                    >
                      <ShieldAlert className="w-4 h-4 text-slate-600" aria-hidden="true" />
                      {portalLabel}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await handleLogout();
                    }}
                    disabled={loading || isProcessingSignOut}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-700 border border-rose-200 hover:bg-rose-50 disabled:opacity-50 transition-colors ${ring}`}
                  >
                    {isProcessingSignOut ? (
                      <>
                        <span className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        Signing out…
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 text-rose-600" aria-hidden="true" />
                        Sign out
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-3.5 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 transition-colors ${ring}`}
                  >
                    <UserPlus className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    Register
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md shadow-emerald-700/30 transition-colors ${ring}`}
                  >
                    <LogIn className="w-4 h-4" aria-hidden="true" />
                    Login
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