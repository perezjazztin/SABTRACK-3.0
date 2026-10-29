'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import { ArrowUp, Clock, Leaf, Mail, Phone } from 'lucide-react';
export { DashboardFooter } from './DashboardFooter';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });
const body = Figtree({ subsets: ['latin'], variable: '--font-body' });

const D = 'font-[family-name:var(--font-display)]';
const ring = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50';

/* Concentric rings, same decorative shape used on the landing page */
function Rings({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={`pointer-events-none absolute ${className}`} fill="none" stroke="currentColor">
      {[90, 70, 50, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} strokeWidth="1.5" />)}
    </svg>
  );
}

const LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Sorting guide', href: '/#guide' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
];

const CONTACTS = [
  { icon: Phone, text: '(043) 784-2190' },
  { icon: Mail, text: 'swmo@sabtrack.lipa.gov.ph' },
  { icon: Clock, text: 'Mon–Fri, 8:00 AM – 5:00 PM' },
];

export const Footer: React.FC = () => {
  const pathname = usePathname() || '';
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/resident');
  const isAuthPage =
    pathname === '/register' ||
    pathname.startsWith('/register') ||
    pathname === '/login' ||
    pathname.startsWith('/login');

  // Dashboards and full-screen auth pages do not render the main landing footer
  if (isDashboard || isAuthPage) {
    return null;
  }

  return (
    <footer
      className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] mt-auto relative overflow-hidden rounded-t-[2.5rem] sm:rounded-t-[3rem] bg-gradient-to-b from-[#064e3b] via-[#043327] to-[#021f17] text-emerald-100 antialiased`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl" />
      <Rings className="-bottom-24 -right-20 w-72 h-72 text-lime-300/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand & Academic Baseline */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl rounded-tr-md bg-gradient-to-br from-lime-300 to-emerald-500 text-emerald-950 shadow-lg shadow-black/30 ring-2 ring-white/20 flex-shrink-0">
                <Leaf className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <p className={`${D} text-2xl font-extrabold tracking-tight text-white`}>SABTRACK 3.0</p>
                <p className="text-xs text-emerald-300/80 font-medium">Barangay Sabang &bull; Lipa City</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-emerald-400/20 text-xs text-emerald-100/90 leading-relaxed italic">
              &ldquo;SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling,
              Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang&rdquo;
            </div>

            <div className="text-xs text-emerald-200/80 space-y-1">
              <p><span className="text-white font-semibold">Proponents:</span> Jazztin H. Perez &bull; Faith A. Valencia &bull; May Sigrid M. Dimaano</p>
              <p>Course: IT 313 — System Analysis and Design &bull; Batangas State University – The NEU, Lipa Campus</p>
              <p>LGU Partner: <span className="text-white font-semibold">Barangay Sabang Council</span>, Lipa City, Batangas, Philippines</p>
            </div>
          </div>

          {/* Links */}
          <nav aria-label="Footer" className="md:col-span-3">
            <h3 className={`${D} text-lg font-bold text-white mb-3`}>Explore</h3>
            <ul className="space-y-2">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`rounded-md text-[15px] text-emerald-100/85 hover:text-lime-300 transition-colors motion-reduce:transition-none ${ring}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact & Tech Stack */}
          <div className="md:col-span-4 space-y-4">
            <div>
              <h3 className={`${D} text-lg font-bold text-white mb-3`}>Contact</h3>
              <ul className="space-y-2.5">
                {CONTACTS.map((c) => (
                  <li key={c.text} className="flex items-center gap-3 text-[15px] text-white">
                    <span className="p-2 rounded-xl rounded-tr-md bg-white/10 border border-emerald-400/20 text-lime-300 flex-shrink-0">
                      <c.icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="break-words min-w-0">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-emerald-300/70 uppercase tracking-wider block mb-2">Engineered With</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-semibold">FastAPI</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-semibold">Next.js</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-mono font-semibold">PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-emerald-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-emerald-200/80">
          <p className="text-center sm:text-left">
            &copy; 2026 SABTRACK Development Team &bull; Built for Barangay Sabang environmental stewardship.
          </p>
          <a
            href="#home"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-emerald-300/20 text-white text-sm font-bold transition-colors motion-reduce:transition-none ${ring}`}
          >
            Back to top
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
};