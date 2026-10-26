'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  AlertTriangle,
  Award,
  ShieldCheck,
  Truck,
  Recycle,
  ChevronRight,
  Send,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';

export default function Home() {
  // Contact Us Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCategory, setContactCategory] = useState('Schedule Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-1.5 pb-12 space-y-10 sm:space-y-14 relative" id="home">
      {/* Ambient subtle light sources creating realistic soft tactile depth */}
      <div
        aria-hidden="true"
        className="absolute top-10 left-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-96 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"
      />

      {/* =========================================================================
          HERO SECTION — TACTILE NEUMORPHIC SOFT UI STAGE
          Convex sculpted surface, soft dual light/dark depth, rich emerald accents
          ========================================================================= */}
      <section className="neu-card-convex rounded-3xl p-6 sm:p-10 lg:p-14 relative overflow-hidden border border-slate-200/70 shadow-neu-raised">
        {/* Soft emerald ambient corner highlight */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Column: Headline, Subtitle, and Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Neumorphic Green Civic Chip */}
            <div className="neu-chip-green inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Barangay Sabang Solid Waste Management Initiative</span>
            </div>

            {/* Impactful Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.18]">
              Make Daily Choices That <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-emerald-600 to-teal-700">
                Shape a Greener Future
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Join SABTRACK to reduce, recycle, and manage waste effortlessly across Barangay Sabang, Lipa City. Access scheduled garbage collections, report community waste violations, and earn gamified SAB-Points for active environmental stewardship.
            </p>

            {/* Tactile Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Link
                href="/register"
                className="neu-btn-primary inline-flex items-center justify-center px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white uppercase tracking-wider group shadow-neu-green hover:shadow-neu-green-pressed transition-all"
              >
                <span>Start Sorting Now</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href="#about"
                className="neu-btn-secondary inline-flex items-center justify-center px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 uppercase tracking-wider shadow-neu-raised hover:shadow-neu-raised-hover transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Tactile Stat Highlights with Eco-Green Sockets */}
            <div className="pt-5 grid grid-cols-3 gap-3 max-w-lg">
              <div className="neu-socket-green p-3.5 rounded-2xl text-center">
                <div className="text-lg sm:text-xl font-black text-emerald-800">100%</div>
                <div className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wide">Purok Coverage</div>
              </div>
              <div className="neu-socket-green p-3.5 rounded-2xl text-center">
                <div className="text-lg sm:text-xl font-black text-emerald-700">RA 9003</div>
                <div className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wide">Ecological ESWM</div>
              </div>
              <div className="neu-socket-green p-3.5 rounded-2xl text-center">
                <div className="text-lg sm:text-xl font-black text-emerald-900">RA 10173</div>
                <div className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-wide">Data Privacy</div>
              </div>
            </div>
          </div>

          {/* Right Column: Isometric Waste Flow Illustration on Neumorphic Pedestal */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="neu-card w-full max-w-md rounded-3xl p-5 shadow-neu-raised hover:shadow-neu-raised-hover border border-slate-200/70 transition-all duration-300 group">
              <div className="neu-socket overflow-hidden rounded-2xl p-2.5 flex items-center justify-center border border-emerald-900/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/waste_flow_illustration.jpg"
                  alt="End-to-End Solid Waste Management Workflow in Barangay Sabang"
                  className="w-full h-auto object-contain transform group-hover:scale-105 transition-transform duration-500 rounded-xl"
                />
              </div>

              {/* Pedestal Tag */}
              <div className="mt-4 pt-3 border-t border-emerald-900/10 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Recycle className="w-4 h-4 text-emerald-600" />
                  <span>Waste Recovery Lifecycle</span>
                </span>
                <span className="neu-chip-green text-[11px] font-bold px-3 py-1 rounded-full">
                  Barangay Sabang Model
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          OPERATIONAL PILLARS (SERVICES)
          Tactile interactive cards with debossed icon sockets in harmonious green palette
          ========================================================================= */}
      <section id="services" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="neu-chip-green inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Operational Pillars
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How SABTRACK Serves Barangay Sabang
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            Bridging residents, collection crews, and barangay officials with a transparent, data-informed solid waste management system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Collection Schedules */}
          <div className="neu-card-interactive p-6 sm:p-7 rounded-3xl space-y-4 border border-slate-200/70 shadow-neu-raised hover:border-emerald-500/30 group">
            <div className="neu-socket-green p-3.5 w-fit rounded-2xl text-emerald-700">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Garbage Schedules</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Timely collection timetables segregated by Biodegradable, Non-Biodegradable, and Recyclables across all Puroks, with instant delay advisories.
            </p>
            <div className="pt-1 text-xs font-bold text-emerald-700 flex items-center group-hover:translate-x-1 transition-transform">
              <span>View Route Calendar</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 2: Violation & Waste Reporting */}
          <div className="neu-card-interactive p-6 sm:p-7 rounded-3xl space-y-4 border border-slate-200/70 shadow-neu-raised hover:border-emerald-500/30 group">
            <div className="neu-socket-green p-3.5 w-fit rounded-2xl text-emerald-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Community Reporting</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Report illegal dump sites, missed pickups, and overflowing bins directly to barangay staff with automatic GPS and EXIF privacy sanitization.
            </p>
            <div className="pt-1 text-xs font-bold text-emerald-800 flex items-center group-hover:translate-x-1 transition-transform">
              <span>Submit Civic Report</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 3: Gamified SAB-Points */}
          <div className="neu-card-interactive p-6 sm:p-7 rounded-3xl space-y-4 border border-slate-200/70 shadow-neu-raised hover:border-emerald-500/30 group">
            <div className="neu-socket-green p-3.5 w-fit rounded-2xl text-teal-700">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">SAB-Points Rewards</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Earn civic points by participating in barangay cleanup drives, zero-waste workshops, and verified waste segregation initiatives.
            </p>
            <div className="pt-1 text-xs font-bold text-teal-700 flex items-center group-hover:translate-x-1 transition-transform">
              <span>Explore Rewards</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Pillar 4: Materials Recovery & Logistics */}
          <div className="neu-card-interactive p-6 sm:p-7 rounded-3xl space-y-4 border border-slate-200/70 shadow-neu-raised hover:border-emerald-500/30 group">
            <div className="neu-socket-green p-3.5 w-fit rounded-2xl text-emerald-900">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">MRF &amp; Truck Logistics</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Equipping barangay personnel with dispatch coordinates, verified weighing protocols, and administrative decision-support analytics.
            </p>
            <div className="pt-1 text-xs font-bold text-emerald-900 flex items-center group-hover:translate-x-1 transition-transform">
              <span>Explore Operations</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ABOUT SECTION — ACADEMIC FOUNDATION & GOVERNANCE BASELINE
          ========================================================================= */}
      <section id="about" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="neu-chip-green inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Academic &amp; Institutional Identity
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            About the SABTRACK 3.0 Initiative
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            A collaborative system designed for academic evaluation and community deployment in Lipa City, Batangas.
          </p>
        </div>

        {/* Academic Card */}
        <div className="neu-card rounded-3xl p-6 sm:p-10 space-y-6 border border-slate-200/70 shadow-neu-raised">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="neu-chip-green flex items-center space-x-2 text-xs font-bold px-4 py-2 rounded-xl w-fit">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>IT 313 — System Analysis and Design</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Official Academic Research Project
              </h3>

              <div className="neu-socket-green p-5 rounded-2xl border-l-4 border-emerald-600">
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed italic font-medium">
                  &ldquo;SABTRACK: A Digital Governance Platform for Garbage Collection Scheduling, Community Violation Reporting, and Gamified Waste Management Engagement in Barangay Sabang&rdquo;
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-1 font-medium">
                <p>
                  <strong className="text-slate-800">Institution:</strong> Batangas State University – The NEU, Lipa Campus
                </p>
                <p>
                  <strong className="text-slate-800">Proponents:</strong> Jazztin H. Perez, Faith A. Valencia, May Sigrid M. Dimaano
                </p>
                <p>
                  <strong className="text-slate-800">Client / LGU Partner:</strong> Barangay Sabang Council (Barangay Local Government Unit), Lipa City, Batangas, Philippines
                </p>
              </div>
            </div>

            <div className="space-y-4 neu-socket p-6 sm:p-7 rounded-2xl border border-emerald-900/10">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Compliance &amp; Ethical Guardrails</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800">Republic Act 9003:</strong> Aligned with the Philippine Ecological Solid Waste Management Act for systematic segregation at source.
                  </span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800">Republic Act 10173:</strong> Strict compliance with the Philippine Data Privacy Act — EXIF scrubbing on report uploads and anonymized public feeds.
                  </span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800">Field Validation Notice:</strong> Fictional demonstration data is flagged with <code className="neu-chip-green px-2 py-0.5 rounded text-[11px] font-mono font-bold">is_demo_data=True</code> until formal barangay route surveys are finalized.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONTACT US SECTION
          Barangay Hall Coordinates, Hotline, and Interactive Resident Inquiry Form
          ========================================================================= */}
      <section id="contact" className="space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="neu-chip-green inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            Get in Touch
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contact Barangay Sabang Environmental Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
            Need collection assistance, schedule clarification, or want to register a community cleanup drive? Reach out to the Barangay Council desk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Barangay Office Information in Forest Green Tactile Container */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#043327] text-white p-7 sm:p-9 rounded-3xl space-y-6 shadow-neu-green border border-emerald-500/30 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none"
            />

            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official Barangay Information
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Barangay Sabang Government Center
              </h3>
              <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
                Solid Waste Management &amp; Environmental Protection Committee, Lipa City, Batangas.
              </p>
            </div>

            <div className="space-y-4 pt-2 text-xs text-slate-200 relative z-10">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/20 text-emerald-300 shadow-neu-xs flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Barangay Hall Location</div>
                  <div className="text-emerald-100/70 text-[11px] mt-0.5">
                    Barangay Sabang, Lipa City, Batangas, Philippines 4217
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/20 text-emerald-300 shadow-neu-xs flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Solid Waste Management Hotline</div>
                  <div className="text-emerald-100/70 text-[11px] mt-0.5 font-mono">
                    (043) 784-2190 / +63 917 842 1900
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/20 text-emerald-300 shadow-neu-xs flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Official Correspondence</div>
                  <div className="text-emerald-100/70 text-[11px] mt-0.5">
                    swmo@sabtrack.lipa.gov.ph / barangaysabang.lipa@gmail.com
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/20 text-emerald-300 shadow-neu-xs flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Office Hours</div>
                  <div className="text-emerald-100/70 text-[11px] mt-0.5">
                    Monday to Friday: 8:00 AM – 5:00 PM <br />
                    (Crews on Saturday Morning Special Dispatch)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tactile Resident Message Form with Sunken/Inset Inputs */}
          <div className="lg:col-span-7 neu-card p-7 sm:p-9 rounded-3xl space-y-5 border border-slate-200/70 shadow-neu-raised">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Send an Inquiry to the Environmental Desk
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Have a question regarding truck schedules or community recycling drives? Leave a message below.
              </p>
            </div>

            {contactSubmitted && (
              <div
                role="status"
                className="neu-socket-green p-4 rounded-2xl text-emerald-900 text-xs flex items-start space-x-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Inquiry Sent Successfully!</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Thank you for reaching out. The Barangay Sabang environmental officer will review your inquiry within office hours.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Maria Clara"
                    className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Contact Email or Phone
                  </label>
                  <input
                    id="contactEmail"
                    type="text"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. resident@gmail.com"
                    className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contactCategory"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Topic Category
                </label>
                <select
                  id="contactCategory"
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="neu-select w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all font-medium"
                >
                  <option value="Schedule Inquiry">Collection Schedule &amp; Routing</option>
                  <option value="Violation Follow-up">Waste Violation / Missed Pickup Follow-up</option>
                  <option value="SAB-Points">SAB-Points &amp; Volunteer Rewards</option>
                  <option value="General Feedback">General Feedback &amp; Suggestions</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contactMessage"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Inquiry Message
                </label>
                <textarea
                  id="contactMessage"
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Detail your inquiry or feedback for the Barangay Sabang team..."
                  className="neu-input w-full px-4 py-2.5 rounded-xl text-xs text-slate-900 outline-none transition-all resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="neu-btn-primary inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white uppercase tracking-wider shadow-neu-green hover:shadow-neu-green-pressed transition-all"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION (REGISTER & LOGIN BANNER)
          ========================================================================= */}
      <section className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 relative overflow-hidden shadow-neu-green border border-emerald-400/30">
        <div
          aria-hidden="true"
          className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-emerald-200 border border-white/20 shadow-neu-sm">
            <Recycle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ready to Build a Cleaner Barangay Sabang?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-lg mx-auto font-medium">
            Register your resident account to monitor waste collection schedules, submit geo-tagged incident reports, and participate in community eco-drives.
          </p>
          <div className="pt-3 flex flex-wrap gap-4 justify-center items-center">
            <Link
              href="/register"
              className="neu-button inline-flex items-center px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-black text-emerald-900 bg-white uppercase tracking-wider shadow-neu-raised hover:bg-white hover:shadow-neu-raised-hover transition-all"
            >
              REGISTER NOW
            </Link>
            <Link
              href="/login"
              className="neu-button-primary inline-flex items-center px-7 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white uppercase tracking-wider shadow-neu-green hover:shadow-neu-green-pressed transition-all border border-emerald-300/30"
            >
              SIGN IN TO PORTAL
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
