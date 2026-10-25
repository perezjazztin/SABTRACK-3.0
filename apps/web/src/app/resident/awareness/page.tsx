'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Video,
  Play,
  Leaf,
  Recycle,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TopicCategory = 'ALL' | 'SEGREGATION' | 'SUSTAINABLE_DEV' | 'VIDEOS' | 'COMPOSTING';

interface EducationalItem {
  id: string;
  category: 'SEGREGATION' | 'SUSTAINABLE_DEV' | 'VIDEOS' | 'COMPOSTING';
  type: 'video' | 'article' | 'matrix';
  title: string;
  subtitle: string;
  durationOrReadTime: string;
  badge: string;
  badgeColor: string;
  videoUrl?: string;
  videoDuration?: string;
  summary: string;
  content: string[];
  keyTakeaways: string[];
}

const EDUCATIONAL_RESOURCES: EducationalItem[] = [
  {
    id: 'video-sabang-cycle',
    category: 'VIDEOS',
    type: 'video',
    title: 'How Barangay Sabang Manages Its Solid Waste',
    subtitle: 'From household curbside collection to Lipa City eco-processing centers.',
    durationOrReadTime: '5 min watch',
    videoDuration: '5:20',
    badge: 'Featured Video',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    videoUrl: 'https://www.youtube-nocookie.com/embed/1u4kQ1q227c',
    summary: 'A visual walkthrough of the municipal garbage truck collection routes, safety protocols for sanitation workers, and how source segregation prevents open dumping.',
    content: [
      'Barangay Sabang produces an estimated 4.2 metric tons of municipal waste daily. When households segregate at the source, over 65% of that waste is diverted away from landfills into composting and recycling streams.',
      'Sanitation collectors face biological and physical hazards when broken glass, needles, or untreated chemicals are mixed with kitchen waste. Proper bagging and labeling protects our neighborhood collectors.',
      'Schedules are strictly divided by purok and waste type. Placing bins out 30 minutes before the scheduled truck arrival prevents stray animal scattering and street clogging.'
    ],
    keyTakeaways: [
      'Segregate waste into biodegradable, recyclable, residual, and hazardous before collection day.',
      'Curbside collection starts at 6:00 AM in designated Purok collection points.',
      'Violations are monitored by Barangay Tanods and environmental marshals under RA 9003.'
    ],
  },
  {
    id: 'video-sorting-habits',
    category: 'VIDEOS',
    type: 'video',
    title: '3 Easy Steps to Perfect Household Segregation',
    subtitle: 'Practical kitchen sorting tips that save time and eliminate foul odors.',
    durationOrReadTime: '3 min watch',
    videoDuration: '3:45',
    badge: 'Quick Video Tutorial',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    videoUrl: 'https://www.youtube-nocookie.com/embed/b73BI9eUkjM',
    summary: 'Learn the two-bin and one-box household setup that makes segregation effortless for all family members.',
    content: [
      'Step 1: The Wet Bin (Green). Keep a small countertop container for food scraps, vegetable peelings, and coffee grounds. Empty this daily into your outdoor organic bin or compost pit.',
      'Step 2: The Clean Recyclables Box (Blue). Rinse plastic containers, soda cans, and tetra paks before dropping them into your dry recyclables box. Clean recyclables never smell or attract pests.',
      'Step 3: The Residual Bag (Black). Only wrap non-recyclable laminated sachets, sanitary waste, and contaminated foils.'
    ],
    keyTakeaways: [
      'Rinse plastic bottles and tin cans before storing to prevent insect infestation.',
      'Keep organic waste dry to minimize foul odors and leachate generation.',
      'Label bins with simple pictures for children and household helpers.'
    ],
  },
  {
    id: 'article-sdgs-sabtrack',
    category: 'SUSTAINABLE_DEV',
    type: 'article',
    title: 'Sustainable Development Goals (SDGs) & Digital Governance',
    subtitle: 'Connecting Barangay Sabang local actions with United Nations SDGs 11 and 12.',
    durationOrReadTime: '4 min read',
    badge: 'Global Goals (SDGs)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    summary: 'Discover how SABTRACK 3.0 aligns local barangay operations with international United Nations sustainability standards for resilient cities and responsible consumption.',
    content: [
      'Sustainable Development Goal 11 (Sustainable Cities and Communities) mandates that cities reduce their per capita adverse environmental impact, with particular attention to air quality and municipal waste management.',
      'Sustainable Development Goal 12 (Responsible Consumption and Production) calls for substantial reduction of waste generation through prevention, reduction, recycling, and reuse by 2030.',
      'SABTRACK 3.0 bridges policy and action by digitizing collection timetables, empowering residents to report illegal dumpings, and rewarding proper segregation through community SAB-Points.'
    ],
    keyTakeaways: [
      'SDG 11 Target 11.6: Halving the per-capita environmental impact of cities through efficient municipal waste collection.',
      'SDG 12 Target 12.5: Substantially reducing waste generation by 2030 via the 3Rs (Reduce, Reuse, Recycle).',
      'Civic engagement in Barangay Sabang directly contributes to national Philippine climate resilience targets.'
    ],
  },
  {
    id: 'article-ra-9003',
    category: 'SUSTAINABLE_DEV',
    type: 'article',
    title: 'RA 9003: Ecological Solid Waste Management Act',
    subtitle: 'Your legal rights, responsibilities, and prohibited acts under Philippine environmental law.',
    durationOrReadTime: '6 min read',
    badge: 'Philippine Law',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    summary: 'A plain-language guide to Republic Act No. 9003, mandatory segregation at source, and penalties for open burning and illegal littering.',
    content: [
      'Republic Act 9003 institutionalized the national framework for ecological waste management in the Philippines. It firmly states that solid waste management is primarily a local government responsibility down to the barangay level.',
      'Section 21 explicitly mandates that segregation of waste shall be conducted primarily at the source — meaning individual households, commercial establishments, and institutions are legally required to segregate.',
      'Prohibited Acts (Section 48): (1) Littering, throwing, or dumping of waste in public spaces, creeks, or canals; (2) Open burning of solid waste (commonly known as "siga"); (3) Causing or permitting collection of non-segregated waste.'
    ],
    keyTakeaways: [
      'Open burning ("siga") is illegal under RA 9003 and the Clean Air Act, carrying fines up to PHP 1,000 or imprisonment.',
      'Barangays have the police power to issue citation tickets for unsegregated garbage placed on curbs.',
      'Community reporting through SABTRACK provides verifiable evidence to combat illegal dumping in Sabang waterways.'
    ],
  },
  {
    id: 'article-home-composting',
    category: 'COMPOSTING',
    type: 'article',
    title: 'Backyard & Apartment Composting Guide',
    subtitle: 'Turn kitchen scraps into nutrient-rich organic soil without bad odors.',
    durationOrReadTime: '5 min read',
    badge: 'Zero Waste Living',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    summary: 'Learn simple composting techniques including the 2:1 brown-to-green ratio, pot composting for small spaces, and natural pest prevention.',
    content: [
      'Composting is nature’s way of recycling. Over 50% of typical Filipino household waste consists of organic, compostable materials like fruit rinds, coffee grounds, and vegetable scraps.',
      'The Golden Ratio: Combine 2 parts "Browns" (carbon-rich: dried leaves, sawdust, shredded unprinted cardboard) with 1 part "Greens" (nitrogen-rich: raw fruit/vegetable trimmings, crushed eggshells).',
      'Apartment Pot Composting: Layer 2 inches of garden soil at the bottom of a terracotta pot, add chopped green waste, cover with 2 inches of dried leaves or soil. Keep moist, aerate weekly, and enjoy fresh organic compost within 6 to 8 weeks.'
    ],
    keyTakeaways: [
      'Never compost meat bones, dairy products, or oily leftovers to prevent rodent intrusion.',
      'Ensure proper drainage and turn the pile weekly to maintain aerobic decomposition.',
      'Finished compost smells like fresh forest rain and enriches potted vegetables.'
    ],
  },
];

const SEGREGATION_BINS = [
  {
    id: 'biodegradable',
    title: 'Biodegradable (Nabubulok)',
    colorClass: 'border-emerald-500 bg-emerald-50/60 text-emerald-950',
    headerBadge: 'bg-emerald-600 text-white',
    icon: Leaf,
    pickupDays: 'Mon, Wed, Fri (6:00 AM - 10:00 AM)',
    allowed: [
      'Fruit & vegetable trimmings',
      'Food leftovers & expired rice',
      'Fish bones & small scrap food',
      'Dried leaves, grass, & garden twigs',
      'Coffee grounds & tea bags',
      'Crushed eggshells',
    ],
    notAllowed: [
      'Plastic bags or wrappers',
      'Sanitary napkins & diapers',
      'Pet feces & veterinary waste',
      'Hazardous paints or chemicals',
    ],
  },
  {
    id: 'recyclable',
    title: 'Recyclables (Maaaring I-recycle)',
    colorClass: 'border-blue-500 bg-blue-50/60 text-blue-950',
    headerBadge: 'bg-blue-600 text-white',
    icon: Recycle,
    pickupDays: 'Tues & Sat (8:00 AM - 12:00 PM)',
    allowed: [
      'PET mineral water bottles (rinsed & flattened)',
      'Clean corrugated cardboard & paper cartons',
      'Aluminum beverage cans & tin cans',
      'Clean white office paper & newspapers',
      'Glass bottles & unbroken jars',
      'Hard plastic shampoo & detergent jugs',
    ],
    notAllowed: [
      'Greasy pizza boxes with food oils',
      'Broken window glass or mirrors',
      'Single-use multi-layer plastic sachets',
      'Styrofoam food containers',
    ],
  },
  {
    id: 'residual',
    title: 'Residual Waste (Di-Nabubulok)',
    colorClass: 'border-slate-500 bg-slate-50/70 text-slate-900',
    headerBadge: 'bg-slate-700 text-white',
    icon: AlertTriangle,
    pickupDays: 'Thursday (7:00 AM - 11:00 AM)',
    allowed: [
      'Multi-layer shampoo and coffee sachets',
      'Candy wrappers and snack chip foils',
      'Worn-out rubber slippers & textiles',
      'Sanitary napkins & baby diapers (wrapped)',
      'Soiled plastic films & disposable cutlery',
      'Styrofoam containers (rinsed)',
    ],
    notAllowed: [
      'Compostable vegetable scraps',
      'Lead-acid or lithium batteries',
      'Fluorescent lamps or bulbs',
      'Clean recyclables that can be reused',
    ],
  },
  {
    id: 'special',
    title: 'Special / Hazardous (Mapanganib)',
    colorClass: 'border-amber-600 bg-amber-50/60 text-amber-950',
    headerBadge: 'bg-amber-600 text-white',
    icon: ShieldCheck,
    pickupDays: 'First Saturday of the Month (Barangay Drop-off Point)',
    allowed: [
      'Spent alkaline & rechargeable lithium batteries',
      'Fluorescent light bulbs & broken CFL tubes',
      'Electronic waste (old phones, cords, circuit boards)',
      'Leftover paint cans, solvents, & varnish',
      'Medical face masks & pharmaceutical bottles',
      'Pesticide & chemical spray cans',
    ],
    notAllowed: [
      'Regular household kitchen waste',
      'Untreated biological or infectious hospital waste',
      'Curbside mixing with daily trash',
    ],
  },
];

export default function AwarenessHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<EducationalItem | null>(null);

  const filteredResources = EDUCATIONAL_RESOURCES.filter((item) => {
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* AwarenessHub Header Banner */}
      <section className="bg-gradient-to-r from-civic-forest via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-soft-raised relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-semibold backdrop-blur-sm border border-white/10">
            <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
            <span>Civic Environmental Education • Barangay Sabang</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AwarenessHub: Waste, SDGs &amp; Climate Action
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/95 leading-relaxed max-w-2xl">
            Read expert environmental guides, watch step-by-step video tutorials, and master waste segregation to earn civic SAB-Points while advancing UN Sustainable Development Goals (SDG 11 &amp; 12) right here in Lipa City.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-100">
              RA 9003 Solid Waste Act
            </span>
            <span className="bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-100">
              UN SDG 11 &amp; 12
            </span>
            <span className="bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-100">
              Curated Video Guides
            </span>
          </div>
        </div>

        {/* Ambient backdrop glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Filter and Search Bar */}
      <section className="bg-[#FAFDFB] rounded-2xl border border-emerald-900/10 shadow-soft-raised p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Topic Category Tabs */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Topic Categories">
            {[
              { key: 'ALL', label: 'All Topics', icon: Globe },
              { key: 'VIDEOS', label: 'Watch & Learn', icon: Video },
              { key: 'SEGREGATION', label: 'Waste Segregation', icon: Recycle },
              { key: 'SUSTAINABLE_DEV', label: 'SDGs & RA 9003', icon: Sparkles },
              { key: 'COMPOSTING', label: 'Home Composting', icon: Leaf },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={selectedCategory === key}
                onClick={() => setSelectedCategory(key as TopicCategory)}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  selectedCategory === key
                    ? 'bg-civic-forest text-white shadow-soft-raised'
                    : 'text-slate-600 hover:text-civic-forest hover:bg-emerald-50/80 active:shadow-soft-pressed'
                )}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tutorials & guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 shadow-soft-inset focus:border-civic-emerald focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>
      </section>

      {/* Featured Video Spotlight */}
      {(selectedCategory === 'ALL' || selectedCategory === 'VIDEOS') && !searchQuery && (
        <section className="bg-[#FAFDFB] rounded-3xl border border-emerald-900/10 shadow-soft-raised p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-xl text-civic-forest shadow-soft-pressed">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-civic-slate">
                  Featured Video Masterclass
                </h2>
                <p className="text-xs text-slate-500">
                  Curated video guide on Barangay Sabang&apos;s waste lifecycle
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Community Watch • 5:20 mins
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Interactive Video Embed Container */}
            <div className="lg:col-span-7 aspect-video rounded-2xl overflow-hidden shadow-soft-raised border border-emerald-900/15 relative bg-slate-900">
              <iframe
                title="How Barangay Sabang Manages Its Solid Waste"
                src="https://www.youtube-nocookie.com/embed/1u4kQ1q227c?rel=0"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Takeaways Card */}
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                Official Orientation
              </div>
              <h3 className="text-base font-bold text-slate-900">
                How Barangay Sabang Manages Its Solid Waste
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Watch how our local garbage collectors, materials recovery facility (MRF), and barangay marshals coordinate to divert recyclable materials and maintain clean roadways.
              </p>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-start text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Mandatory 4-stream household waste segregation</span>
                </div>
                <div className="flex items-start text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Curbside pickup hours: 6:00 AM to 10:00 AM</span>
                </div>
                <div className="flex items-start text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Earn SAB-Points for participating in community clean-up drives</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveModalItem(EDUCATIONAL_RESOURCES[0])}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-civic-forest text-white shadow-soft-raised hover:bg-civic-forestHover transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Read Full Synopsis &amp; Transcript
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Segregation Matrix (Tactile Color-Coded Bins) */}
      {(selectedCategory === 'ALL' || selectedCategory === 'SEGREGATION') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-civic-slate flex items-center">
                <Recycle className="w-4 h-4 mr-2 text-civic-emerald" />
                Barangay Sabang Waste Segregation Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Follow color-coded waste classifications to protect sanitation workers and prevent collection rejection
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SEGREGATION_BINS.map((bin) => {
              const Icon = bin.icon;
              return (
                <div
                  key={bin.id}
                  className={cn(
                    'rounded-2xl border-2 p-4 shadow-soft-raised flex flex-col justify-between transition-all duration-150',
                    bin.colorClass
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase', bin.headerBadge)}>
                        {bin.id}
                      </span>
                      <Icon className="w-4 h-4 opacity-80" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold">{bin.title}</h3>
                      <p className="text-[11px] font-medium opacity-90 mt-0.5">
                        🗓️ {bin.pickupDays}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        Allowed Items:
                      </span>
                      <ul className="text-xs space-y-1">
                        {bin.allowed.map((item, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-1.5 text-emerald-700 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/10 mt-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                      Never Include:
                    </span>
                    <ul className="text-[11px] opacity-80 space-y-0.5">
                      {bin.notAllowed.map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1 text-red-600 font-bold">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Educational Articles & Guides Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-civic-slate flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-civic-emerald" />
              Civic Knowledge Guides &amp; Video Tutorials
            </h2>
            <p className="text-xs text-slate-500">
              Browse interactive articles and video guides on Sustainable Development, Philippine environmental law, and home composting
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {filteredResources.length} {filteredResources.length === 1 ? 'guide' : 'guides'} available
          </span>
        </div>

        {filteredResources.length === 0 ? (
          <div className="bg-[#FAFDFB] rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
            <Info className="w-8 h-8 mx-auto text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700">No resources found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or selecting &quot;All Topics&quot; to see all educational guides.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((item) => (
              <div
                key={item.id}
                className="bg-[#FAFDFB] rounded-2xl border border-emerald-900/10 shadow-soft-raised p-5 flex flex-col justify-between hover:shadow-soft-raised-lg transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border', item.badgeColor)}>
                      {item.badge}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 flex items-center">
                      {item.type === 'video' ? <Video className="w-3 h-3 mr-1 text-slate-400" /> : <BookOpen className="w-3 h-3 mr-1 text-slate-400" />}
                      {item.durationOrReadTime}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-800">
                    {item.type === 'video' ? '▶ Watch Tutorial' : '📖 Read Article'}
                  </span>
                  <button
                    onClick={() => setActiveModalItem(item)}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-civic-forest hover:bg-civic-forest hover:text-white transition-colors shadow-soft-raised"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reader / Video Modal Dialog */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-soft-raised-lg border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block', activeModalItem.badgeColor)}>
                  {activeModalItem.badge} • {activeModalItem.durationOrReadTime}
                </span>
                <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
                  {activeModalItem.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {activeModalItem.subtitle}
                </p>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Video: Render Player */}
            {activeModalItem.type === 'video' && activeModalItem.videoUrl && (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-soft-raised border border-slate-300 bg-slate-900">
                <iframe
                  title={activeModalItem.title}
                  src={`${activeModalItem.videoUrl}?rel=0`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Reading Content */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeModalItem.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Key Takeaways */}
            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/80 space-y-2">
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                Key Citizen Takeaways
              </h4>
              <ul className="text-xs text-emerald-900 space-y-1.5">
                {activeModalItem.keyTakeaways.map((tip, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Close action */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors shadow-soft-raised"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
