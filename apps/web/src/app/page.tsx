'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import {
  Award, ArrowRight, BellRing, CheckCircle2, Clock, Compass, FileText,
  Globe2, Mail, MapPin, Phone, Recycle, Send, ShieldCheck, Sparkles, Truck,
  Leaf, Trash2, AlertTriangle,
} from 'lucide-react';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });
const body = Figtree({ subsets: ['latin'], variable: '--font-body' });

/* ---------------------------------------------------------------------------
   Shared bits
   --------------------------------------------------------------------------- */
const D = 'font-[family-name:var(--font-display)]';
const ring = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40';
const input =
  `w-full px-5 py-3.5 rounded-2xl text-base text-slate-900 bg-slate-50 border border-slate-300 placeholder:text-slate-500 focus:bg-white focus:border-emerald-700 transition-colors ${ring}`;
const label = 'block text-sm font-bold text-slate-700 mb-1.5';
const lift = 'transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0';
const dots = { backgroundImage: 'radial-gradient(rgba(6,95,70,.18) 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' };

function Badge({ icon: Icon, children, className = '' }: { icon: React.ElementType; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-900 ${className}`}>
      <Icon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      {children}
    </span>
  );
}

/* Concentric rings: a reusable decorative shape */
function Rings({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 200" className={`pointer-events-none absolute ${className}`} fill="none" stroke="currentColor">
      {[90, 70, 50, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} strokeWidth="1.5" />)}
    </svg>
  );
}

/* Soft wave divider */
function Wave({ fill, flip = false }: { fill: string; flip?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 90" preserveAspectRatio="none" className={`absolute inset-x-0 w-full h-12 sm:h-20 ${flip ? 'top-0 rotate-180' : 'bottom-0'}`}>
      <path fill={fill} d="M0,48 C180,100 360,0 600,40 C840,80 1020,10 1220,44 C1320,60 1390,50 1440,40 L1440,90 L0,90 Z" />
    </svg>
  );
}

const STATS = [
  { value: '7+ Puroks', label: 'Covered across Sabang', color: 'text-slate-900' },
  { value: '98%', label: 'On-time collection rate', color: 'text-emerald-700' },
  { value: 'RA 10173', label: 'Safe & anonymous reporting', color: 'text-slate-900' },
  { value: '100%', label: 'For Barangay Sabang', color: 'text-teal-700' },
];

const STEPS = [
  { n: 1, icon: Clock, tag: 'Smart scheduling', title: 'Check your purok timetable', body: 'Know when the truck arrives in your purok. Sort biodegradable and non-biodegradable trash ahead of time to prevent roadside piles.', foot: 'Timely morning dispatch', img: '/images/card_scheduling.jpg', alt: 'Scheduled truck collection in Batangas', chip: 'bg-emerald-700', shape: 'rounded-tl-[5rem] rounded-br-[5rem] rounded-tr-3xl rounded-bl-3xl' },
  { n: 2, icon: ShieldCheck, tag: 'Civic vigilance', title: 'Snap & report incidents', body: 'Spot an illegal dumpsite, uncollected trash or open burning? Upload a photo. GPS data is scrubbed from the image for your privacy.', foot: 'Confidential reports', img: '/images/card_reporting.jpg', alt: 'Resident reporting street cleanliness', chip: 'bg-teal-700', shape: 'rounded-t-[8rem] rounded-b-3xl' },
  { n: 3, icon: Award, tag: 'Gamified rewards', title: 'Earn points & build pride', body: 'Every verified clean habit earns SAB-Points. Climb the Purok Cleanliness Leaderboard and inspire your neighbors.', foot: 'Leaderboard & eco-rewards', img: '/images/card_community.jpg', alt: 'Youth and volunteers in Sabang', chip: 'bg-lime-700', shape: 'rounded-tr-[5rem] rounded-bl-[5rem] rounded-tl-3xl rounded-br-3xl' },
];

const STREAMS = [
  { name: 'Biodegradable (Nabubulok)', tip: 'Food scraps, vegetable peels, dried garden leaves, fruit rinds, leftover food.', icon: Leaf, box: 'bg-emerald-50 border-emerald-200', orb: 'bg-emerald-200/70', chip: 'bg-emerald-600', text: 'text-emerald-950' },
  { name: 'Recyclables (I-recycle)', tip: 'Clean PET bottles, plastic containers, cardboard cartons, aluminum cans, paper.', icon: Recycle, box: 'bg-sky-50 border-sky-200', orb: 'bg-sky-200/70', chip: 'bg-sky-600', text: 'text-sky-950' },
  { name: 'Residual (Di-nabubulok)', tip: 'Single-use sachets, snack wrappers, soiled plastic film, worn slippers, styrofoam.', icon: Trash2, box: 'bg-slate-100 border-slate-200', orb: 'bg-slate-300/70', chip: 'bg-slate-600', text: 'text-slate-900' },
  { name: 'Special & hazardous', tip: 'Expired medicines, used batteries, fluorescent tubes, electronics, paint cans.', icon: AlertTriangle, box: 'bg-rose-50 border-rose-200', orb: 'bg-rose-200/70', chip: 'bg-rose-600', text: 'text-rose-950' },
];

const SDGS = [
  { n: 11, bg: '#F99D26', box: 'border-amber-200 from-amber-50 to-orange-50/40', target: 'Target 11.6', title: 'Sustainable Cities & Communities', body: 'Minimizing per-capita environmental impact through solid waste management and disciplined barangay collection routes.' },
  { n: 12, bg: '#BF8B2E', box: 'border-yellow-200 from-yellow-50 to-amber-50/40', target: 'Target 12.5', title: 'Responsible Consumption & Production', body: 'Reducing waste generation through source segregation, materials recovery facility (MRF) logistics and recycling.' },
  { n: 13, bg: '#48773E', box: 'border-emerald-200 from-emerald-50 to-teal-50/40', target: 'Target 13.3', title: 'Climate Action & Education', body: 'Ending illegal open burning (siga) and roadside dumping through civic reporting and ecological awareness.' },
  { n: 17, bg: '#19486A', box: 'border-blue-200 from-blue-50 to-indigo-50/40', target: 'Target 17.17', title: 'Partnerships for the Goals', body: 'Collaborative digital governance between BatStateU, Barangay Sabang leaders and local residents.' },
];

const CONTACTS = [
  { icon: MapPin, title: 'Barangay Hall location', text: 'Barangay Sabang, Lipa City, Batangas, Philippines 4217' },
  { icon: Phone, title: 'Solid Waste Management hotline', text: '(043) 784-2190 / +63 917 842 1900' },
  { icon: Mail, title: 'Official correspondence', text: 'swmo@sabtrack.lipa.gov.ph / barangaysabang.lipa@gmail.com' },
  { icon: Clock, title: 'Office hours', text: 'Monday to Friday: 8:00 AM – 5:00 PM (Saturday morning special route dispatch)' },
];

export default function Home() {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('Schedule Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [bulletinContact, setBulletinContact] = useState('');
  const [bulletinSubscribed, setBulletinSubscribed] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setContactName(''); setContactEmail(''); setContactMessage('');
    setTimeout(() => setContactSubmitted(false), 6000);
  };
  const handleBulletinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinContact.trim()) return;
    setBulletinSubscribed(true);
    setBulletinContact('');
  };

  return (
    <div id="home" className={`${display.variable} ${body.variable} font-[family-name:var(--font-body)] w-full pb-28 relative overflow-hidden text-slate-800 antialiased`}>
      <style>{`
        @keyframes sabRise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
        @keyframes sabDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,-20px)}}
        .sab-rise{animation:sabRise .8s cubic-bezier(.2,.7,.2,1) both}
        .sab-d1{animation-delay:.12s}.sab-d2{animation-delay:.26s}.sab-d3{animation-delay:.4s}
        .sab-drift{animation:sabDrift 14s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.sab-rise,.sab-drift{animation:none}}
      `}</style>

      {/* ============================ 1. HERO ============================ */}
      <section className="w-full relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero_aerial.jpg" alt="Aerial view of Barangay Sabang" className="w-full h-full object-cover object-center" />
          {/* Readable on the left, photo stays vivid on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#f4f8f5] from-30% via-[#f4f8f5]/80 via-55% to-transparent max-lg:from-[#f4f8f5]/95 max-lg:via-[#f4f8f5]/90 max-lg:to-[#f4f8f5]/70" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/70 to-transparent" />
          {/* Decorative shapes */}
          <div aria-hidden="true" className="sab-drift absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-emerald-300/30 blur-3xl" />
          <div aria-hidden="true" className="absolute top-1/3 right-[-6rem] w-80 h-80 rounded-[40%_60%_55%_45%] bg-lime-300/30 blur-2xl" />
          <Rings className="hidden lg:block -bottom-16 left-[38%] w-72 h-72 text-emerald-700/20" />
          <div aria-hidden="true" className="hidden lg:block absolute top-28 left-[44%] w-28 h-28 opacity-70" style={dots} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-14 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center flex-1">
          <div className="lg:col-span-7 space-y-7">
            <Badge icon={Sparkles} className="sab-rise bg-white/80 backdrop-blur-md shadow-sm">Together for a cleaner Barangay Sabang</Badge>

            <h1 className={`${D} sab-rise sab-d1 text-6xl sm:text-7xl lg:text-[6.25rem] font-extrabold tracking-[-0.04em] text-slate-900 leading-[0.95]`}>
              Save{' '}
              <span className="relative inline-block text-emerald-700">
                Sabang
                <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute left-0 -bottom-1 w-full h-3 text-lime-400">
                  <path d="M3 11 C70 2 140 15 297 5" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
              ,<br />Save Tomorrow.
            </h1>

            <p className="sab-rise sab-d2 text-slate-700 text-lg sm:text-xl leading-relaxed max-w-xl">
              We unite residents, local leaders and barangay staff to build a disciplined, greener and sustainable community. Check your purok’s collection schedule, report neighborhood issues instantly, and earn rewards for keeping Sabang clean.
            </p>

            <div className="sab-rise sab-d3 flex flex-col sm:flex-row gap-3.5 sm:items-center">
              <Link href="/register" className={`group inline-flex items-center justify-center px-8 py-4 rounded-full font-bold text-base text-white bg-emerald-700 hover:bg-emerald-800 shadow-lg shadow-emerald-700/30 transition-colors ${ring}`}>
                Join our community
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className={`inline-flex items-center justify-center px-7 py-4 rounded-full font-bold text-base text-slate-800 bg-white/90 hover:bg-white border border-slate-300 shadow-sm backdrop-blur-md transition-colors ${ring}`}>
                <Compass className="w-5 h-5 mr-2 text-emerald-600" aria-hidden="true" />
                How SABTRACK works
              </a>
            </div>

            <div className="flex items-center gap-3.5 text-sm sm:text-base text-slate-700 font-medium">
              <div className="flex -space-x-2" aria-hidden="true">
                {[['JP', 'bg-emerald-600'], ['FV', 'bg-teal-600'], ['SD', 'bg-emerald-800'], ['+7', 'bg-lime-700']].map(([t, c]) => (
                  <div key={t} className={`w-9 h-9 rounded-full ${c} text-white flex items-center justify-center text-xs font-bold ring-2 ring-white`}>{t}</div>
                ))}
              </div>
              <span>Over <strong className="text-slate-900">3,500+ households</strong> participating across 7 puroks</span>
            </div>
          </div>
        </div>

        {/* Stats bar with curved top */}
        <div className="relative z-10 w-full bg-white/90 backdrop-blur-md rounded-t-[3rem] border-t border-white">
          <dl className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.value}>
                <dt className={`${D} text-2xl sm:text-4xl font-extrabold tracking-tight ${s.color}`}>{s.value}</dt>
                <dd className="text-sm text-slate-600 font-medium mt-1">{s.label}</dd>
              </div>
            ))}
          </dl>
          <p className="text-center text-xs text-slate-500 py-4">Figures shown are sample data for the pilot.</p>
        </div>
      </section>

      <div className="space-y-24 sm:space-y-32 pt-20 sm:pt-28">
        {/* ========================= 2. HOW IT WORKS ========================= */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-32 relative">
          <div aria-hidden="true" className="hidden md:block absolute -top-10 right-0 w-40 h-40 opacity-70" style={dots} />
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
              <div className="space-y-4 max-w-2xl">
                <Badge icon={Compass}>The resident journey</Badge>
                <h2 className={`${D} text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.02]`}>
                  How SABTRACK powers our daily waste management
                </h2>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                  Designed so any resident, from students to grandparents, can stay informed and help keep Barangay Sabang clean.
                </p>
              </div>
              <Link href="/register" className={`inline-flex items-center text-base font-bold text-emerald-700 hover:text-emerald-800 group rounded-lg ${ring}`}>
                Access resident features
                <ArrowRight className="w-5 h-5 ml-1.5 group-hover:translate-x-1 transition-transform motion-reduce:transition-none" aria-hidden="true" />
              </Link>
            </div>

            {/* Tall image cards with leaf-like corners and a dark gradient for contrast */}
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`group relative h-[32rem] overflow-hidden shadow-lg hover:shadow-2xl ${s.shape} ${i === 1 ? 'md:mt-14' : ''} ${lift}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt={s.alt} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 via-45% to-transparent" />
                  <span className={`${D} absolute top-6 left-6 ${s.chip} text-white text-sm font-extrabold px-4 py-2 rounded-full shadow-md ring-4 ring-white/30`}>Step {s.n}</span>
                  <Rings className="-top-10 -right-10 w-40 h-40 text-white/25" />
                  <div className="absolute inset-x-0 bottom-0 p-7 text-white space-y-2">
                    <span className="w-12 h-12 rounded-full bg-white/95 text-emerald-800 flex items-center justify-center shadow"><s.icon className="w-5 h-5" aria-hidden="true" /></span>
                    <p className="text-sm font-bold text-emerald-200">{s.tag}</p>
                    <h3 className={`${D} text-2xl font-bold tracking-tight leading-snug`}>{s.title}</h3>
                    <p className="text-[15px] text-slate-100 leading-relaxed">{s.body}</p>
                    <p className="pt-3 mt-1 border-t border-white/25 text-sm font-bold text-emerald-200">{s.foot}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ======================= 3. SORTING GUIDE + SMS ======================= */}
        <section id="guide" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 bg-white rounded-[2.5rem] rounded-tr-[5rem] p-7 sm:p-10 border border-slate-200 shadow-sm space-y-7 relative overflow-hidden">
              <div aria-hidden="true" className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-emerald-100" />
              <div className="space-y-3 relative">
                <Badge icon={Recycle}>RA 9003 guidelines</Badge>
                <h3 className={`${D} text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.02] max-w-md`}>Household waste sorting at source</h3>
                <p className="text-base text-slate-600 leading-relaxed">Separating into four streams makes truck collection quicker and protects barangay sanitation staff.</p>
              </div>
              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STREAMS.map((s) => (
                  <div key={s.name} className={`relative overflow-hidden p-5 rounded-3xl border space-y-3 ${s.box}`}>
                    <span aria-hidden="true" className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full ${s.orb}`} />
                    <div className="relative flex items-center gap-3">
                      <span className={`grid h-10 w-10 place-items-center rounded-2xl text-white ${s.chip}`}><s.icon className="w-5 h-5" aria-hidden="true" /></span>
                      <span className={`${D} text-base font-bold leading-tight ${s.text}`}>{s.name}</span>
                    </div>
                    <p className="relative text-[15px] text-slate-700 leading-relaxed">{s.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-[#d9f99d] via-[#bef264] to-[#84cc16] rounded-[2.5rem] rounded-bl-[5rem] p-7 sm:p-10 text-slate-900 flex flex-col justify-between shadow-sm">
              <Rings className="-bottom-20 -right-20 w-72 h-72 text-slate-900/15" />
              <div className="space-y-4 relative">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/10 text-sm font-bold"><BellRing className="w-4 h-4" aria-hidden="true" />Barangay SMS advisories</span>
                <h3 className={`${D} text-4xl sm:text-5xl font-extrabold text-slate-950 tracking-[-0.03em] leading-[1]`}>Stay informed.<br />Never miss a truck.</h3>
                <p className="text-base text-slate-800 leading-relaxed">Get schedule alerts, holiday collection changes and clean-up announcements on your mobile phone.</p>
              </div>
              <div className="pt-8 space-y-3 relative">
                {bulletinSubscribed ? (
                  <div role="status" className="p-4 rounded-2xl bg-white text-emerald-950 text-base flex items-center gap-2.5 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" aria-hidden="true" />
                    <span className="font-bold">Subscribed! You’ll receive collection updates.</span>
                  </div>
                ) : (
                  <form onSubmit={handleBulletinSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <label htmlFor="bulletin" className="sr-only">Mobile number or email</label>
                    <input id="bulletin" type="text" required value={bulletinContact} onChange={(e) => setBulletinContact(e.target.value)} placeholder="Mobile number or email" className={`${input} flex-1 !bg-white !border-slate-400`} />
                    <button type="submit" className={`px-7 py-3.5 rounded-full bg-slate-900 text-white text-base font-bold hover:bg-slate-800 transition-colors ${ring}`}>Subscribe</button>
                  </form>
                )}
                <p className="text-sm text-slate-800 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />Protected under RA 10173 (Data Privacy Act). No advertising.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ 4. ABOUT + SDGs ============================ */}
        <section id="about" className="relative scroll-mt-32">
          <div aria-hidden="true" className="absolute inset-x-0 top-24 bottom-0 bg-gradient-to-b from-[#f4f8f5] to-white" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pt-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <Badge icon={Globe2}>Academic &amp; global sustainability framework</Badge>
              <h2 className={`${D} text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.02]`}>About SABTRACK 3.0</h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">A digital governance project for Barangay Sabang, Lipa City, aligned with the United Nations Sustainable Development Goals.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-slate-600">UN Sustainable Development Goals alignment</h3>
                <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">UN 2030 Agenda</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {SDGS.map((g, i) => (
                  <li key={g.n} className={`relative overflow-hidden p-6 border bg-gradient-to-br space-y-3 shadow-sm hover:shadow-lg transition-shadow ${g.box} ${i % 2 ? 'rounded-[2rem] rounded-tl-[3.5rem]' : 'rounded-[2rem] rounded-br-[3.5rem]'}`}>
                    <span aria-hidden="true" className={`${D} absolute -bottom-6 -right-2 text-[9rem] font-extrabold leading-none opacity-10`} style={{ color: g.bg }}>{g.n}</span>
                    <div className="relative flex items-center justify-between">
                      <span className={`${D} w-14 h-14 rounded-2xl text-white flex items-center justify-center font-extrabold text-xl shadow-md rotate-[-6deg]`} style={{ backgroundColor: g.bg }}><span className="sr-only">Goal </span>{g.n}</span>
                      <span className="text-xs font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-full">{g.target}</span>
                    </div>
                    <h4 className={`${D} relative text-lg font-bold tracking-tight text-slate-900 leading-snug`}>{g.title}</h4>
                    <p className="relative text-[15px] text-slate-700 leading-relaxed">{g.body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div aria-hidden="true" className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-emerald-100/70" />
              <div className="relative space-y-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 text-sm font-bold border border-emerald-200"><FileText className="w-4 h-4 text-emerald-700" aria-hidden="true" />IT 313 — System Analysis and Design</span>
                <h3 className={`${D} text-3xl font-extrabold tracking-tight text-slate-900`}>Official academic research project</h3>
                <blockquote className={`${D} p-6 rounded-3xl rounded-tl-none bg-emerald-50/80 border-l-4 border-emerald-700 text-lg text-emerald-950 leading-snug font-medium`}>
                  &ldquo;SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang&rdquo;
                </blockquote>
                <dl className="space-y-2 text-[15px] text-slate-700">
                  <div><dt className="inline font-bold text-slate-900">Institution: </dt><dd className="inline">Batangas State University – The NEU, Lipa Campus</dd></div>
                  <div><dt className="inline font-bold text-slate-900">Proponents: </dt><dd className="inline">Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano</dd></div>
                  <div><dt className="inline font-bold text-slate-900">Client / LGU partner: </dt><dd className="inline">Barangay Sabang Council (Barangay Local Government Unit), Lipa City, Batangas, Philippines</dd></div>
                </dl>
              </div>

              <div className="relative p-6 sm:p-7 rounded-3xl rounded-tr-[3rem] bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ShieldCheck className="w-5 h-5 text-emerald-600" aria-hidden="true" />Statutory compliance &amp; ethical guardrails</h4>
                <ul className="space-y-4 text-[15px] text-slate-700 leading-relaxed">
                  {[
                    ['Republic Act 9003:', 'Philippine Ecological Solid Waste Management Act compliance for systematic segregation at source.'],
                    ['Republic Act 10173:', 'Philippine Data Privacy Act compliance, with automatic EXIF GPS sanitization on uploads.'],
                  ].map(([t, d]) => (
                    <li key={t} className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-slate-900">{t}</strong> {d}</span></li>
                  ))}
                  <li className="flex items-start gap-2.5"><CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span><strong className="text-slate-900">Field validation notice:</strong> Synthetic evaluation data is labeled <code className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-sm font-mono font-bold">is_demo_data=True</code> until formal barangay route surveys are finalized.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ 5. CONTACT ============================ */}
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-32">
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <Badge icon={Phone}>Get in touch</Badge>
              <h2 className={`${D} text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.02]`}>Contact the Barangay Sabang Environmental Desk</h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">Need collection help, a schedule clarified, or want to register a community clean-up drive? Reach out to the Barangay Council desk.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#043327] text-white p-7 sm:p-10 rounded-[2.5rem] rounded-tl-[5rem] space-y-7 shadow-xl border border-emerald-500/30 relative overflow-hidden">
                <div aria-hidden="true" className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                <Rings className="-bottom-24 -left-20 w-72 h-72 text-emerald-300/15" />
                <div className="relative z-10 pt-4">
                  <span className="text-sm font-bold text-emerald-300">Official barangay information</span>
                  <h3 className={`${D} text-3xl font-bold tracking-tight mt-1`}>Barangay Sabang Government Center</h3>
                  <p className="text-[15px] text-emerald-100 mt-2 leading-relaxed">Solid Waste Management &amp; Environmental Protection Committee, Lipa City, Batangas.</p>
                </div>
                <ul className="space-y-5 relative z-10">
                  {CONTACTS.map((c) => (
                    <li key={c.title} className="flex items-start gap-3.5">
                      <span className="p-3 rounded-2xl rounded-tr-md bg-white/10 border border-emerald-400/20 text-emerald-300 flex-shrink-0"><c.icon className="w-5 h-5" aria-hidden="true" /></span>
                      <div>
                        <p className="font-semibold text-white text-base">{c.title}</p>
                        <p className="text-emerald-100 text-[15px] mt-0.5 leading-snug">{c.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-7 bg-white p-7 sm:p-10 rounded-[2.5rem] rounded-br-[5rem] space-y-6 border border-slate-200 shadow-sm">
                <div>
                  <h3 className={`${D} text-3xl font-bold tracking-tight text-slate-900`}>Send an inquiry to the Environmental Desk</h3>
                  <p className="text-base text-slate-600 mt-1">Questions about truck schedules or recycling drives? Leave a message below.</p>
                </div>

                <div aria-live="polite">
                  {contactSubmitted && (
                    <div role="status" className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 flex items-start gap-3 border border-emerald-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-base">Inquiry sent successfully!</p>
                        <p className="text-sm text-emerald-800 mt-0.5">Thank you for reaching out. The Barangay Sabang environmental officer will review your inquiry within office hours.</p>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contactName" className={label}>Your name</label>
                      <input id="contactName" type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Maria Clara" className={input} />
                    </div>
                    <div>
                      <label htmlFor="contactEmail" className={label}>Contact email or phone</label>
                      <input id="contactEmail" type="text" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g. resident@gmail.com" className={input} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contactCategory" className={label}>Topic category</label>
                    <select id="contactCategory" value={contactCategory} onChange={(e) => setContactCategory(e.target.value)} className={input}>
                      <option value="Schedule Inquiry">Collection schedule &amp; routing</option>
                      <option value="Violation Follow-up">Waste violation / missed pickup follow-up</option>
                      <option value="SAB-Points">SAB-Points &amp; volunteer rewards</option>
                      <option value="General Feedback">General feedback &amp; suggestions</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contactMessage" className={label}>Inquiry message</label>
                    <textarea id="contactMessage" rows={4} required value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Tell the Barangay Sabang team how we can help…" className={`${input} resize-none`} />
                  </div>
                  <button type="submit" className={`inline-flex items-center px-8 py-4 rounded-full text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md shadow-emerald-700/20 transition-colors ${ring}`}>
                    <Send className="w-5 h-5 mr-2" aria-hidden="true" />Submit inquiry
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== 6. CTA ============================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white rounded-[3rem] p-8 sm:p-20 text-center relative overflow-hidden shadow-2xl border border-emerald-400/30">
            <div aria-hidden="true" className="sab-drift absolute top-0 right-1/4 w-72 h-72 bg-emerald-300/15 rounded-full blur-3xl pointer-events-none" />
            <Rings className="-top-24 -left-24 w-96 h-96 text-white/15" />
            <Rings className="-bottom-28 -right-20 w-96 h-96 text-lime-300/20" />
            <div className="absolute inset-x-0 bottom-0 h-16 opacity-30" aria-hidden="true"><Wave fill="#bef264" /></div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl rotate-6 flex items-center justify-center mx-auto text-lime-200 border border-white/20 shadow-md"><Truck className="w-8 h-8" aria-hidden="true" /></div>
              <h2 className={`${D} text-4xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-[1]`}>Ready to build a cleaner Barangay Sabang?</h2>
              <p className="text-base sm:text-lg text-emerald-50 leading-relaxed max-w-lg mx-auto">Register your resident account to see collection schedules, submit geo-tagged incident reports and join community eco-drives.</p>
              <div className="pt-3 flex flex-wrap gap-4 justify-center">
                <Link href="/register" className={`px-9 py-4 rounded-full text-base font-extrabold text-emerald-900 bg-lime-300 hover:bg-white shadow-lg transition-colors ${ring}`}>Register now</Link>
                <Link href="/login" className={`px-9 py-4 rounded-full text-base font-bold text-white bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-300/40 shadow-md transition-colors ${ring}`}>Sign in to portal</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}