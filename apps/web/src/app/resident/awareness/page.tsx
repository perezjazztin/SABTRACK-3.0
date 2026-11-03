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
  Scale,
  Calendar,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplets,
  Package,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TopicCategory = 'ALL' | 'VIDEOS' | 'SEGREGATION' | 'SUSTAINABLE_DEV' | 'COMPOSTING';

interface EducationalItem {
  id: string;
  category: 'VIDEOS' | 'SEGREGATION' | 'SUSTAINABLE_DEV' | 'COMPOSTING';
  type: 'video' | 'article';
  title: string;
  subtitle: string;
  durationOrReadTime: string;
  badge: string;
  badgeColor: string;
  videoUrl?: string;
  externalWatchUrl?: string;
  articleUrl?: string;
  sourceName?: string;
  videoDuration?: string;
  summary: string;
  content: string[];
  keyTakeaways: string[];
}

/**
 * STRICT VERIFIED VIDEO CATALOG
 * Only these 3 verified YouTube resources are authorized for the Awareness Hub.
 */
const VERIFIED_VIDEOS = [
  {
    id: 'video-segregation-3rs',
    title: 'Gabay: Tamang Pagtatapon at Paghihiwalay ng Basura',
    topic: 'Tamang Paghihiwalay ng Basura (Segregation & 3Rs)',
    subtitle: 'Household segregation methods, 3Rs (Reduce, Reuse, Recycle), and clean container preparation before collection.',
    durationOrReadTime: '8 min watch',
    videoDuration: '8:15',
    embedUrl: 'https://www.youtube-nocookie.com/embed/AQbqdQosQEY',
    watchUrl: 'https://www.youtube.com/watch?v=AQbqdQosQEY',
    focus: 'Household segregation methods, 3Rs (Reduce, Reuse, Recycle), and clean container preparation before collection.',
    summary: 'Master household segregation under Philippine ecological standards: sorting Nabubulok, Nareresiklo, Residual, and Special waste, with clean container preparation (Banlawan at Patuyuin).',
    content: [
      'Effective household waste management begins directly at the source: in our kitchens, living spaces, and backyards in Barangay Sabang.',
      'The Golden Rule of Recycling is "Banlawan at Patuyuin" (Clean, Dry, and Empty). Rinsing PET bottles, aluminum cans, and food cartons before storage eliminates foul odors, prevents fly infestations, and prevents recyclables from being contaminated and sent to landfills.',
      'Applying the 3Rs—Reduce, Reuse, and Recycle—drastically cuts down daily household waste. Pair this with our mandatory curbside sorting to support our local sanitation crew and Materials Recovery Facility (MRF).'
    ],
    keyTakeaways: [
      'Always practice "Banlawan at Patuyuin" (Clean, Dry, Empty) before storing recyclables.',
      'Sort waste strictly at source into biodegradable, recyclable, residual, and special bins.',
      'Prevent fly infestations and foul odors by draining liquids from biodegradable food scraps.'
    ],
  },
  {
    id: 'video-ra-9003',
    title: 'Batas RA 9003: Ecological Solid Waste Management Act',
    topic: 'Batas sa Basura (RA 9003 Guidelines)',
    subtitle: 'Government policies, fines, ecological waste classification, and the "No Segregation, No Collection" rule.',
    durationOrReadTime: '6 min watch',
    videoDuration: '6:40',
    embedUrl: 'https://www.youtube-nocookie.com/embed/QGjPyPBpevY',
    watchUrl: 'https://www.youtube.com/watch?v=QGjPyPBpevY',
    focus: 'Government policies, fines, ecological waste classification, and the "No Segregation, No Collection" rule.',
    summary: 'Understand the national legal mandates of Republic Act 9003, barangay enforcement powers, prohibited acts like pagsisiga and open dumping, and strict collection compliance.',
    content: [
      'Republic Act 9003 establishes the nationwide mandate for ecological solid waste management, making segregation at source legally required for all households and establishments.',
      'Under the strict "No Segregation, No Collection" policy enforced in Barangay Sabang, garbage trucks and collection teams will decline unsegregated or improperly bagged waste.',
      'Prohibited acts under RA 9003 include open burning (pagsisiga), littering in public places, dumping in vacant lots and waterways, and mixing hazardous chemicals with regular domestic trash. Violators face barangay citation tickets and municipal fines.'
    ],
    keyTakeaways: [
      'Strict "No Segregation, No Collection" policy is enforced by Barangay Sabang sanitation workers.',
      'Open burning (pagsisiga) and canal dumping are strictly prohibited by law with municipal fines.',
      'Special and hazardous wastes must go directly to the Barangay MRF or designated drop-off stations.'
    ],
  },
  {
    id: 'video-composting-guide',
    title: 'Gabay sa Paggawa ng Compost Gamit ang Tirang Pagkain',
    topic: 'Paano Mag-Compost sa Bahay (Home & Container Composting)',
    subtitle: 'Zero-odor small-space composting, balancing green kitchen scraps with brown dry leaves/cardboard.',
    durationOrReadTime: '7 min watch',
    videoDuration: '7:10',
    embedUrl: 'https://www.youtube-nocookie.com/embed/mDIVpJgjoXQ',
    watchUrl: 'https://www.youtube.com/watch?v=mDIVpJgjoXQ',
    focus: 'Zero-odor small-space composting, balancing green kitchen scraps with brown dry leaves/cardboard.',
    summary: 'Step-by-step practical guide on how to make nutrient-rich organic compost at home or in an apartment using kitchen leftovers, raw vegetable trimmings, and container aeration.',
    content: [
      'Composting transforms over 50% of your household kitchen waste into nutrient-dense organic fertilizer, diverting wet organics away from municipal collection trucks.',
      'Achieve zero-odor composting by balancing Green materials (nitrogen-rich: vegetable peels, fruit rinds, coffee grounds) with Brown materials (carbon-rich: dry leaves, shredded unprinted cardboard, sawdust).',
      'Container and pot composting can be done even in small urban spaces. Aerate or turn the compost weekly, maintain moist sponge consistency, and never add meat, oil, or dairy.'
    ],
    keyTakeaways: [
      'Maintain a balance of Green scraps (nitrogen) and Brown dry matter (carbon) to prevent odor.',
      'Drain liquid from raw kitchen scraps before adding to your composting bin.',
      'Turn the compost weekly for proper aeration; never add meat bones, greasy oils, or dairy.'
    ],
  },
];

const EDUCATIONAL_RESOURCES: EducationalItem[] = [
  {
    id: 'video-segregation-3rs',
    category: 'VIDEOS',
    type: 'video',
    title: 'Gabay: Tamang Pagtatapon at Paghihiwalay ng Basura',
    subtitle: 'Household segregation methods, 3Rs (Reduce, Reuse, Recycle), and clean container preparation before collection.',
    durationOrReadTime: '8 min watch',
    videoDuration: '8:15',
    badge: 'Verified Video Guide',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    videoUrl: 'https://www.youtube-nocookie.com/embed/AQbqdQosQEY',
    externalWatchUrl: 'https://www.youtube.com/watch?v=AQbqdQosQEY',
    sourceName: 'DENR / Knowledge Channel Community Education',
    summary: 'Master household segregation under Philippine ecological standards: sorting Nabubulok, Nareresiklo, Residual, and Special waste, with clean container preparation (Banlawan at Patuyuin).',
    content: [
      'Effective household waste management begins directly at the source: in our kitchens, living spaces, and backyards in Barangay Sabang.',
      'The Golden Rule of Recycling is "Banlawan at Patuyuin" (Clean, Dry, and Empty). Rinsing PET bottles, aluminum cans, and food cartons before storage eliminates foul odors, prevents fly infestations, and prevents recyclables from being contaminated and sent to landfills.',
      'Applying the 3Rs—Reduce, Reuse, and Recycle—drastically cuts down daily household waste. Pair this with our mandatory curbside sorting to support our local sanitation crew and Materials Recovery Facility (MRF).'
    ],
    keyTakeaways: [
      'Always practice "Banlawan at Patuyuin" (Clean, Dry, Empty) before storing recyclables.',
      'Sort waste strictly at source into biodegradable, recyclable, residual, and special bins.',
      'Prevent fly infestations and foul odors by draining liquids from biodegradable food scraps.'
    ],
  },
  {
    id: 'video-ra-9003',
    category: 'VIDEOS',
    type: 'video',
    title: 'Batas RA 9003: Ecological Solid Waste Management Act',
    subtitle: 'Government policies, fines, ecological waste classification, and the "No Segregation, No Collection" rule.',
    durationOrReadTime: '6 min watch',
    videoDuration: '6:40',
    badge: 'Verified Video Guide',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    videoUrl: 'https://www.youtube-nocookie.com/embed/QGjPyPBpevY',
    externalWatchUrl: 'https://www.youtube.com/watch?v=QGjPyPBpevY',
    sourceName: 'Philippine Ecological Solid Waste Management Broadcast',
    summary: 'Understand the national legal mandates of Republic Act 9003, barangay enforcement powers, prohibited acts like pagsisiga and open dumping, and strict collection compliance.',
    content: [
      'Republic Act 9003 establishes the nationwide mandate for ecological solid waste management, making segregation at source legally required for all households and establishments.',
      'Under the strict "No Segregation, No Collection" policy enforced in Barangay Sabang, garbage trucks and collection teams will decline unsegregated or improperly bagged waste.',
      'Prohibited acts under RA 9003 include open burning (pagsisiga), littering in public places, dumping in vacant lots and waterways, and mixing hazardous chemicals with regular domestic trash. Violators face barangay citation tickets and municipal fines.'
    ],
    keyTakeaways: [
      'Strict "No Segregation, No Collection" policy is enforced by Barangay Sabang sanitation workers.',
      'Open burning (pagsisiga) and canal dumping are strictly prohibited by law with municipal fines.',
      'Special and hazardous wastes must go directly to the Barangay MRF or designated drop-off stations.'
    ],
  },
  {
    id: 'video-composting-guide',
    category: 'COMPOSTING',
    type: 'video',
    title: 'Gabay sa Paggawa ng Compost Gamit ang Tirang Pagkain',
    subtitle: 'Zero-odor small-space composting, balancing green kitchen scraps with brown dry leaves/cardboard.',
    durationOrReadTime: '7 min watch',
    videoDuration: '7:10',
    badge: 'Verified Video Guide',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    videoUrl: 'https://www.youtube-nocookie.com/embed/mDIVpJgjoXQ',
    externalWatchUrl: 'https://www.youtube.com/watch?v=mDIVpJgjoXQ',
    sourceName: 'Organic Waste Reduction & Household Composting Guide',
    summary: 'Step-by-step practical guide on how to make nutrient-rich organic compost at home or in an apartment using kitchen leftovers, raw vegetable trimmings, and container aeration.',
    content: [
      'Composting transforms over 50% of your household kitchen waste into nutrient-dense organic fertilizer, diverting wet organics away from municipal collection trucks.',
      'Achieve zero-odor composting by balancing Green materials (nitrogen-rich: vegetable peels, fruit rinds, coffee grounds) with Brown materials (carbon-rich: dry leaves, shredded unprinted cardboard, sawdust).',
      'Container and pot composting can be done even in small urban spaces. Aerate or turn the compost weekly, maintain moist sponge consistency, and never add meat, oil, or dairy.'
    ],
    keyTakeaways: [
      'Maintain a balance of Green scraps (nitrogen) and Brown dry matter (carbon) to prevent odor.',
      'Drain liquid from raw kitchen scraps before adding to your composting bin.',
      'Turn the compost weekly for proper aeration; never add meat bones, greasy oils, or dairy.'
    ],
  },
  {
    id: 'article-ra-9003',
    category: 'SUSTAINABLE_DEV',
    type: 'article',
    title: 'RA 9003: Ecological Solid Waste Management Act & Barangay Regulations',
    subtitle: 'The legal framework, "No Segregation, No Collection" enforcement, and prohibited acts in Lipa City.',
    durationOrReadTime: '5 min read',
    badge: 'Pillar 1: The Law',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    articleUrl: 'https://lawphil.net/statutes/repacts/ra2001/ra_9003_2001.html',
    sourceName: 'The Lawphil Project / Philippine Laws (RA 9003)',
    summary: 'A plain-language guide reinforcing Republic Act 9003, mandatory source segregation for households, prohibitions on open burning (pagsisiga), and the essential role of the Sabang MRF.',
    content: [
      'Republic Act 9003 (Ecological Solid Waste Management Act of 2000) mandates that solid waste management is primarily a local government responsibility down to the barangay level.',
      'Section 21 explicitly requires that segregation of waste must be conducted primarily at the source — meaning individual households, commercial establishments, and institutions are legally required to segregate.',
      'Barangay Sabang strictly enforces the "No Segregation, No Collection" policy. Collection teams will reject mixed or unsegregated waste bags at curbside checkpoints.',
      'Prohibited Acts & Fines (Section 48): (1) Open burning of waste (pagsisiga) is strictly banned and carries fines; (2) Littering or dumping in public places, esteros, or vacant lots; (3) Causing or permitting collection of non-segregated waste.',
      'Purpose of the Barangay Materials Recovery Facility (MRF): The Sabang MRF receives sorted recyclables, processes garden trimmings into community compost, and coordinates special collection schedules for hazardous items.'
    ],
    keyTakeaways: [
      'Waste segregation at source is mandatory for every household under Section 21 of RA 9003.',
      'Strict "No Segregation, No Collection" policy applies across all puroks in Barangay Sabang.',
      'Open burning (pagsisiga) and dumping in canals or vacant lots carry official citation tickets and municipal fines.',
      'Deliver recyclable batches and special waste directly to the Barangay MRF.'
    ],
  },
  {
    id: 'article-collection-discipline',
    category: 'SEGREGATION',
    type: 'article',
    title: 'Collection Schedule Discipline & Curbside Protocols',
    subtitle: 'Assigned Purok truck windows, proper bin placement, and eliminating overnight garbage dumping.',
    durationOrReadTime: '4 min read',
    badge: 'Pillar 3: Collection Discipline',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    articleUrl: 'https://emb.gov.ph/ecological-solid-waste-management/',
    sourceName: 'DENR Environmental Management Bureau (EMB) Solid Waste Policies',
    summary: 'Learn the strict rules for placing waste outside only on your assigned Purok collection day to prevent stray animal scattering, road obstructions, and drainage clogging.',
    content: [
      'System Integration with SABTRACK: Each Purok in Barangay Sabang has designated collection days and specific morning truck windows. Placing bins outside strictly within this window ensures efficient operations.',
      'Prohibition on Overnight Garbage Placement: Residents are strictly prohibited from putting garbage bags or bins on streets overnight. Stray dogs, cats, and rodents tear unmonitored plastic bags, scattering dirty food waste across streets and storm drains.',
      'Bin Positioning Guidelines: Place your covered bins outside 30 minutes before your scheduled Purok collection window. Ensure all bags are tied securely and bins are properly covered.',
      'Keep Drainage Clear: Never position garbage bags or bulky waste on top of gutter grates or drainage manholes.'
    ],
    keyTakeaways: [
      'Place bins outside ONLY on your assigned Purok collection day and truck window.',
      'Never place garbage out overnight; protect streets from stray animal scattering.',
      'Always use covered bins or securely sealed sacks to prevent pest attraction and foul leachate.'
    ],
  },
  {
    id: 'article-home-composting',
    category: 'COMPOSTING',
    type: 'article',
    title: 'Backyard & Apartment Composting Guide (Zero-Odor Methods)',
    subtitle: 'Turn raw kitchen scraps into rich organic fertilizer using container aerobic composting.',
    durationOrReadTime: '5 min read',
    badge: 'Pillar 4: DIY Reduction',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    articleUrl: 'https://www.epa.gov/recycle/composting-home',
    sourceName: 'US Environmental Protection Agency (EPA) — Composting At Home Official Guide',
    summary: 'Actionable techniques for container aerobic composting, balancing green kitchen scraps with brown dry leaves, and eliminating bad smells.',
    content: [
      'Composting is nature’s recycling engine. Over 50% of typical Filipino household garbage consists of organic kitchen scraps like vegetable trimmings, fruit rinds, and coffee grounds.',
      'The 2:1 Brown-to-Green Balancing Formula: Combine 2 parts "Browns" (carbon-rich: dried leaves, sawdust, shredded unprinted cardboard) with 1 part "Greens" (nitrogen-rich: raw vegetable trimmings, fruit rinds, crushed eggshells).',
      'Apartment Container Composting: Use a 20-liter aerated bucket or terracotta pot. Drill small aeration holes, line the base with 2 inches of dried leaves, add drained green scraps, and top with soil or dry matter. Keep moist like a wrung-out sponge.',
      'Items to Never Compost: Avoid cooked oily foods, meat leftovers, fish bones, dairy, and animal waste to prevent unpleasant odors, flies, and rodent intrusions.'
    ],
    keyTakeaways: [
      'Drain all liquid from raw kitchen scraps before adding to your composting bin.',
      'Balance 2 parts Brown carbon matter with 1 part Green nitrogen scraps for odor-free decomposition.',
      'Aerate or turn your compost weekly to ensure oxygen flow and faster decomposition.'
    ],
  },
  {
    id: 'article-diy-waste-reduction',
    category: 'COMPOSTING',
    type: 'article',
    title: 'Practical DIY Waste Reduction: Eco-Bricking & Safe Upcycling',
    subtitle: 'Zero-waste household strategies for non-recyclable wrappers and everyday plastic containers.',
    durationOrReadTime: '4 min read',
    badge: 'Pillar 4: DIY Reduction',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    articleUrl: 'https://ecobricks.org/how/',
    sourceName: 'Global Ecobrick Alliance (GEA) Official 10-Step Standard',
    summary: 'Step-by-step instructions on making dense plastic eco-bricks from residual sachets and safely upcycling household containers.',
    content: [
      'The Eco-Brick Solution for Residuals: Multi-layer food packaging, sachet packets, and damaged plastic bags cannot be recycled by standard municipal facilities. Eco-bricking packs these clean, dry plastics into solid building blocks.',
      'How to Build an Eco-Brick: (1) Wash and thoroughly dry single-use plastic sachets and snack foils; (2) Cut larger plastics into small strips; (3) Compact them tightly into a clean PET bottle using a blunt wooden stick until rock-hard.',
      'Safe Household Upcycling: Repurpose clean glass jars for pantry storage, use tin cans as seedling pots, and turn empty laundry detergent bottles into garden watering scoops before sending items to disposal.',
      'Barangay Sabang Eco-Projects: Completed eco-bricks with uniform density can be turned over to the Barangay Hall or MRF for community park benches and garden borders.'
    ],
    keyTakeaways: [
      'Ensure all plastic wrappers are 100% clean and completely dry before eco-bricking.',
      'Pack plastics tightly until the bottle is dense and cannot be compressed with fingers.',
      'Upcycle glass jars and plastic containers for household storage to curb waste generation.'
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
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    articleUrl: 'https://sdgs.un.org/goals/goal11',
    sourceName: 'United Nations Sustainable Development Goals (SDG 11: Sustainable Cities)',
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
    id: 'article-epr-act-11898',
    category: 'SUSTAINABLE_DEV',
    type: 'article',
    title: 'RA 11898: Extended Producer Responsibility (EPR) Act of 2022',
    subtitle: 'Holding corporate packaging producers accountable and establishing recovery frameworks.',
    durationOrReadTime: '5 min read',
    badge: 'Pillar 1: Corporate Accountability',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    articleUrl: 'https://lawphil.net/statutes/repacts/ra2022/ra_11898_2022.html',
    sourceName: 'The Lawphil Project / Philippine Laws (RA 11898 EPR Act)',
    summary: 'Understand how the EPR Act of 2022 amends RA 9003 to oblige large brand enterprises to take financial and operational responsibility for their plastic packaging footprint throughout its lifecycle.',
    content: [
      'Republic Act No. 11898 institutionalizes Extended Producer Responsibility (EPR) in the Philippines, amending Republic Act 9003 to confront plastic pollution directly at the industrial source.',
      'Obliged Enterprises (manufacturers, brand owners, and importers with total assets exceeding ₱100 million) are legally required to establish verifiable recovery programs for their flexible, rigid, and single-use plastic packaging.',
      'Under the EPR framework, companies must partner with local government units (LGUs), barangay Materials Recovery Facilities (MRFs), and accredited waste collectors to divert plastic packaging from water bodies and landfills.',
      'National recovery targets scale up progressively from 20% to 80% diversion. Through SABTRACK 3.0, Barangay Sabang positions community sorting and collection telemetry to interface transparently with municipal and national EPR audit registers.'
    ],
    keyTakeaways: [
      'RA 11898 obliges large brand owners to recover and recycle post-consumer plastic packaging.',
      'Covers flexible sachets, rigid plastics, multilayer laminates, and polystyrene packaging.',
      'Barangay Sabang collection data helps verify local diversion for national EPR compliance registries.'
    ],
  },
  {
    id: 'article-open-burning-health',
    category: 'SEGREGATION',
    type: 'article',
    title: 'Health Hazards of Open Burning (Pagsisiga) & Clean Air Act (RA 8749)',
    subtitle: 'Respiratory risks of dioxins, fine particulates (PM2.5), and legal penalties under environmental law.',
    durationOrReadTime: '4 min read',
    badge: 'Pillar 1: Public Health & Clean Air',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    articleUrl: 'https://lawphil.net/statutes/repacts/ra1999/ra_8749_1999.html',
    sourceName: 'The Lawphil Project / Philippine Laws (RA 8749 Clean Air Act)',
    summary: 'A critical public health guide explaining why burning dry leaves, plastics, and household refuse is outlawed under both RA 9003 and the Philippine Clean Air Act of 1999.',
    content: [
      'Open burning of domestic garbage and yard waste—locally known as "pagsisiga"—remains one of the most hazardous mispractices in residential communities, producing hazardous smoke plumes at ground level.',
      'Combusting plastics, food packaging, and chemically treated timber releases persistent organic pollutants (POPs) including dioxins, furans, carbon monoxide, and PM2.5 particulates directly into neighboring homes.',
      'Prolonged smoke exposure severely triggers asthma attacks, chronic bronchitis, cardiovascular stress, and developmental risks for infants, pregnant mothers, and senior citizens.',
      'Both Section 48 of Republic Act 9003 and Section 20 of Republic Act 8749 (Philippine Clean Air Act) strictly outlaw open burning across urban and rural barangays, authorizing barangay citation tickets and police fines against violators.'
    ],
    keyTakeaways: [
      'Open burning (pagsisiga) releases carcinogenic dioxins, furans, and fine particulate matter (PM2.5).',
      'Severely impacts vulnerable neighbors, infants, and residents with asthma and COPD.',
      'Prohibited by both RA 9003 and RA 8749; compost dried leaves instead of burning them.'
    ],
  },
  {
    id: 'article-ewaste-hazardous-safety',
    category: 'SEGREGATION',
    type: 'article',
    title: 'Electronic Waste (E-Waste) & Household Hazardous Materials Protocol',
    subtitle: 'Safe handling of lithium batteries, fluorescent bulbs, broken glass, and toxic chemicals.',
    durationOrReadTime: '5 min read',
    badge: 'Pillar 2: Hazardous Waste Stream',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    articleUrl: 'https://lawphil.net/statutes/repacts/ra1990/ra_6969_1990.html',
    sourceName: 'The Lawphil Project / Philippine Laws (RA 6969 Toxic Substances & Hazardous Waste Act)',
    summary: 'Comprehensive household safety protocols for identifying, storing, and safely turning in toxic chemicals, busted fluorescent lamps, and lithium batteries to protect sanitation workers and groundwater.',
    content: [
      'Special and hazardous wastes constitute a small percentage of household output by weight, but pose the greatest catastrophic risks of toxic leaching, chemical poisoning, and landfill fires.',
      'Busted Fluorescent Lamps (CFLs and linear tubes) contain pressurized elemental mercury vapor. If broken in regular garbage bags, mercury vapors contaminate ambient air and can cause neurological trauma to garbage collectors.',
      'Lithium-ion and alkaline batteries can ignite garbage trucks or landfill compactors under compression. Always insulate battery terminals with non-conductive electrical tape before bringing them to special waste drives.',
      'Under Barangay Sabang safety rules, hazardous wastes must never be mixed with curbside trash bags. Bring items directly to the Barangay MRF Special Waste Chamber or the first-Saturday drop-off station.'
    ],
    keyTakeaways: [
      'Never place batteries, CFL tubes, paint cans, or expired medicines into curbside garbage bags.',
      'Tape battery contacts with electrical tape to eliminate friction fires in collection vehicles.',
      'Surrender hazardous waste directly to the Barangay Sabang MRF or scheduled special collection drives.'
    ],
  },
  {
    id: 'article-mrf-circular-economy',
    category: 'SUSTAINABLE_DEV',
    type: 'article',
    title: 'Materials Recovery Facility (MRF) Operations & Circular Economy in Lipa City',
    subtitle: 'How Barangay Sabang processes community recyclables, organic compost, and circular trade.',
    durationOrReadTime: '5 min read',
    badge: 'Pillar 3: Circular Economy',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    articleUrl: 'https://nswmc.emb.gov.ph/',
    sourceName: 'National Solid Waste Management Commission (NSWMC) MRF Operations Portal',
    summary: 'Discover the inner workings of the Barangay Sabang Materials Recovery Facility (MRF), its circular sorting lines, community organic soil production, and partnerships with local junk shops and recyclers.',
    content: [
      'Section 32 of Republic Act 9003 mandates the establishment of a Materials Recovery Facility (MRF) in every barangay or cluster of contiguous barangays to receive, sort, and process waste.',
      'The Sabang MRF functions as the circular nerve center of our community, diverting over 45% of solid waste away from the Lipa City municipal sanitary landfill through rigorous secondary sorting.',
      'Sorted organic kitchen scraps and yard trimmings are converted into high-grade compost used in community vegetable gardens, urban greening, and school agro-ecological plots.',
      'Cleaned plastics, corrugated boxes, and metals are weighed, bundled, and channeled directly to certified recycling processors and junk shop cooperatives, generating sustainable civic revenue.'
    ],
    keyTakeaways: [
      'Barangay MRF diverts substantial waste volumes from landfills through secondary recovery.',
      'Organic fractions become nutrient-rich compost distributed for community food gardens.',
      'Source-separated clean recyclables support local green livelihood cooperatives.'
    ],
  },
];

/**
 * CITIZEN ACTION CHECKLIST
 * Practical everyday habits for Barangay Sabang residents
 */
const CITIZEN_ACTION_CHECKLIST = [
  {
    id: 'drain-liquids',
    icon: Droplets,
    badge: 'Step 1: Preparation',
    title: 'Drain All Liquids First',
    desc: 'Drain residual soups, gravies, and oils from food waste before bagging into green biodegradable bins to prevent foul leachate and maggot breeding.',
  },
  {
    id: 'rinse-dry',
    icon: CheckCircle2,
    badge: 'Step 2: Cleanliness',
    title: 'Banlawan at Patuyuin (Rinse & Dry)',
    desc: 'Rinse plastic soda bottles, aluminum beverage cans, and milk boxes with recycled water and let dry before placing in the blue recycling bin.',
  },
  {
    id: 'flatten-boxes',
    icon: Package,
    badge: 'Step 3: Space Saver',
    title: 'Flatten Cardboard & Crush Bottles',
    desc: 'Flatten corrugated boxes and compress plastic bottles to save 70% bin capacity and maximize collection truck payload efficiency.',
  },
  {
    id: 'time-discipline',
    icon: Clock,
    badge: 'Step 4: Timing',
    title: 'Strict 30-Minute Placement Window',
    desc: 'Bring covered bins outside strictly 30 minutes before your assigned Purok truck window. Never leave bins outside overnight.',
  },
  {
    id: 'hazardous-isolation',
    icon: AlertTriangle,
    badge: 'Step 5: Safety First',
    title: 'Isolate Batteries & Busted Glass',
    desc: 'Wrap broken glass securely in cardboard and insulate battery terminals with tape. Bring them to the Barangay MRF on Special Waste Saturdays.',
  },
  {
    id: 'compost-leaves',
    icon: Flame,
    badge: 'Step 6: Zero Smoke',
    title: 'Compost Leaves Instead of Siga',
    desc: 'Do not burn yard trimmings or dried leaves. Layer them with kitchen scraps in a backyard compost pit to create free organic fertilizer.',
  },
];

/**
 * FREQUENTLY ASKED CIVIC QUESTIONS (FAQs)
 */
const CIVIC_FAQS = [
  {
    q: 'Why does Barangay Sabang enforce the strict "No Segregation, No Collection" rule?',
    a: 'Under Section 21 and Section 48 of Republic Act 9003, local governments and waste collectors are legally prohibited from collecting unsegregated waste. Mixing organic and recyclable waste causes contamination, generates greenhouse gases in landfills, and increases municipal trucking costs. Barangay collection crews will decline mixed bags and issue non-compliance notices.',
  },
  {
    q: 'What should I do if my garbage was skipped during the scheduled truck round?',
    a: 'First, check if your bags were placed outside within your assigned Purok morning collection window. Second, inspect if the bag contained mixed or prohibited items (e.g., plastics mixed with food scraps or uninsulated batteries). Correct any segregation issues and set the covered bin outside on your next designated collection day.',
  },
  {
    q: 'Can animal feces and cat litter be placed in the Green Biodegradable bin?',
    a: 'No. Pet feces and animal litter carry pathogenic bacteria, roundworm parasites, and toxoplasmosis organisms that are not eradicated by standard aerobic composting. Always wrap animal waste securely in sealed bags and dispose of it exclusively in the Black (Residual) bin.',
  },
  {
    q: 'Why is open burning (pagsisiga) outlawed even inside my private yard?',
    a: 'Open burning is illegal under both RA 9003 (Section 48) and the Philippine Clean Air Act (RA 8749, Section 20). Smoke from burning yard trimmings and plastics releases carcinogenic dioxins, furans, and fine particulates (PM2.5) that drift into neighbors\' homes and trigger severe respiratory attacks in children and seniors. Violations carry official barangay citation tickets.',
  },
  {
    q: 'Where and when can I surrender busted fluorescent lamps (CFLs) and old electronics?',
    a: 'Never dispose of fluorescent bulbs, lithium batteries, or electronic waste in domestic trash bags as they contain toxic mercury or ignite vehicle fires. Surrender them directly to the Barangay Sabang Materials Recovery Facility (MRF) Hazardous Waste Chamber or during the first-Saturday special waste collection drive.',
  },
  {
    q: 'How do residents earn and redeem SAB-Points through SABTRACK 3.0?',
    a: 'Residents earn SAB-Points by verifying household waste segregation compliance, surrendering sorted recyclables and verified eco-bricks at the Barangay MRF, reporting environmental infractions (such as illegal dumpings or open burning), and completing educational modules. Accumulated SAB-Points can be redeemed for organic fertilizer, seedling kits, and municipal fee discounts.',
  },
];

/**
 * STANDARD WASTE CLASSIFICATION & SEGREGATION (Pillar 2)
 */
const SEGREGATION_BINS = [
  {
    id: 'biodegradable',
    title: 'Biodegradable (Nabubulok) - Green',
    subtitle: 'Food waste, scraps & garden trim',
    colorClass: 'border-emerald-500 bg-emerald-50/70 text-emerald-950',
    headerBadge: 'bg-emerald-600 text-white',
    icon: Leaf,
    ruleNotice: 'Golden Rule: Must be drained of excess liquid and kept tightly covered.',
    pickupDays: 'Mon, Wed, Fri (6:00 AM - 10:00 AM)',
    allowed: [
      'Food waste & leftover rice/meals',
      'Fruit and vegetable peels & trimmings',
      'Fish, chicken & meat scraps',
      'Crushed eggshells & coffee grounds',
      'Fallen leaves, grass cuttings & garden trim',
    ],
    notAllowed: [
      'Single-use plastic bags & candy wrappers',
      'Disposable diapers & sanitary napkins',
      'Pet feces, litter & veterinary waste',
      'Excess soup, cooking oils & chemical liquids',
    ],
  },
  {
    id: 'recyclable',
    title: 'Recyclables (Maaaring I-recycle) - Blue',
    subtitle: 'Clean plastic, paper, cardboard, glass & metal',
    colorClass: 'border-blue-500 bg-blue-50/70 text-blue-950',
    headerBadge: 'bg-blue-600 text-white',
    icon: Recycle,
    ruleNotice: 'Golden Rule: Clean, Dry, and Empty (Banlawan at Patuyuin) before storage.',
    pickupDays: 'Tues & Sat (8:00 AM - 12:00 PM)',
    allowed: [
      'PET mineral water & soda bottles (rinsed & crushed)',
      'Clean glass containers & unbroken jars',
      'Aluminum beverage cans & tin food cans',
      'Clean corrugated cardboard boxes & cartons',
      'Clean dry white paper, magazines & newspapers',
    ],
    notAllowed: [
      'Greasy pizza boxes & oil-stained paper',
      'Broken mirror glass or window panes',
      'Multi-layer foil snack sachets',
      'Styrofoam food containers',
    ],
  },
  {
    id: 'residual',
    title: 'Residual Waste (Di-Nabubulok) - Black',
    subtitle: 'Non-recyclable wrappers & sanitary waste',
    colorClass: 'border-slate-500 bg-slate-50/80 text-slate-900',
    headerBadge: 'bg-slate-800 text-white',
    icon: AlertTriangle,
    ruleNotice: 'Notice: Non-recyclable items for sanitary disposal; wrap securely.',
    pickupDays: 'Thursday (7:00 AM - 11:00 AM)',
    allowed: [
      'Single-use coffee, shampoo & seasoning sachets',
      'Snack, biscuit & candy plastic wrappers',
      'Damaged plastic slippers & worn-out rags',
      'Used sanitary napkins & baby diapers (wrapped)',
      'Soiled plastic films & disposable cutlery',
    ],
    notAllowed: [
      'Biodegradable organic vegetable scraps',
      'Clean recyclable bottles and aluminum cans',
      'Lead-acid or lithium-ion batteries',
      'Fluorescent bulbs or broken glass',
    ],
  },
  {
    id: 'special',
    title: 'Special / Hazardous (Mapanganib) - Red',
    subtitle: 'E-waste, chemical containers & toxic items',
    colorClass: 'border-rose-500 bg-rose-50/70 text-rose-950',
    headerBadge: 'bg-rose-700 text-white',
    icon: ShieldCheck,
    ruleNotice: 'Safety Precaution: Strictly prohibited in regular garbage collection! Bring directly to Barangay MRF or scheduled special drop-off stations.',
    pickupDays: 'Barangay MRF Drop-Off / 1st Saturday Special Drive',
    allowed: [
      'Busted fluorescent bulbs & CFL light tubes',
      'Vehicle & dry-cell household batteries',
      'Household electronics & cords (e-waste)',
      'Empty aerosol cans, paint cans & varnish tins',
      'Expired medicines & pharmaceutical vials',
    ],
    notAllowed: [
      'Regular household kitchen waste',
      'Unbagged mixing with curbside garbage',
      'Dumping down sink drains, storm gutters or creeks',
    ],
  },
];

export default function AwarenessHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalItem, setActiveModalItem] = useState<EducationalItem | null>(null);
  const [activeFeaturedVideoIndex, setActiveFeaturedVideoIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const currentFeaturedVideo = VERIFIED_VIDEOS[activeFeaturedVideoIndex];

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
            <span>Civic Environmental Education • Barangay Sabang, Lipa City</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AwarenessHub: Waste, SDGs &amp; Climate Action
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/95 leading-relaxed max-w-2xl">
            Welcome to the SABTRACK Awareness Hub Content Engine. Educating our community on Republic Act 9003, mandatory waste segregation at source, collection schedule discipline, and practical zero-waste living.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <span className="bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-100 flex items-center">
              <Scale className="w-3 h-3 mr-1 text-emerald-300" />
              RA 9003 Legal Mandate
            </span>
            <span className="bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-100 flex items-center">
              <Recycle className="w-3 h-3 mr-1 text-emerald-300" />
              No Segregation, No Collection
            </span>
            <span className="bg-black/25 px-2.5 py-1 rounded-lg border border-white/10 text-emerald-100 flex items-center">
              <Video className="w-3 h-3 mr-1 text-emerald-300" />
              Verified Official Video Catalog
            </span>
          </div>
        </div>

        {/* Ambient backdrop glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 4 Content Pillars Summary Grid */}
      <section className="bg-[#FAFDFB] rounded-3xl border border-slate-200/80 shadow-soft-raised p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-civic-forest">
            <Sparkles className="w-3.5 h-3.5 text-civic-emerald" />
            <span>Core Environmental Pillars</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Four Core Pillars of SABTRACK Awareness
          </h2>
          <p className="text-xs text-slate-500">
            Barangay Sabang&apos;s solid waste governance standard under Philippine environmental law
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Pillar 1 */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center">
              <Scale className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              RA 9003 &amp; Local Law
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Mandatory segregation at source. Strict <strong>&ldquo;No Segregation, No Collection&rdquo;</strong> policy. Zero tolerance &amp; fines for open burning (<em>pagsisiga</em>) and illegal dumping.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center">
              <Recycle className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Standard Classification
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              4 distinct waste streams: Green (Nabubulok), Blue (Nareresiklo), Black (Residual), and Red (Special/Hazardous). Always practice <strong>&ldquo;Banlawan at Patuyuin&rdquo;</strong>.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Schedule Discipline
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Place bins outside <strong>ONLY</strong> on assigned Purok days and truck windows. Never leave garbage overnight to prevent stray animals from tearing bags across streets.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-sm space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center">
              <Leaf className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
              Practical DIY Reduction
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Household container and backyard aerobic composting for raw kitchen scraps. Eco-bricking for non-recyclable wrappers and safe household upcycling.
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="bg-[#FAFDFB] rounded-2xl border border-slate-200/70 shadow-soft-raised p-4 space-y-3">
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
              className="neu-input w-full pl-9 pr-3 py-2 text-xs rounded-xl focus:border-civic-emerald focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>
      </section>

      {/* Verified Official Video Catalog & Interactive Player */}
      {(selectedCategory === 'ALL' || selectedCategory === 'VIDEOS') && !searchQuery && (
        <section className="neu-card rounded-3xl border border-slate-200/80 shadow-neu-raised p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-100 text-civic-forest rounded-xl shadow-soft-pressed">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-civic-slate">
                  Verified Video Catalog &amp; Masterclass
                </h2>
                <p className="text-xs text-slate-500">
                  Strictly verified video guides authorized by the SABTRACK Environmental Council
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                Verified Educational Media
              </span>
            </div>
          </div>

          {/* Video Selector Pills */}
          <div className="flex flex-wrap gap-2">
            {VERIFIED_VIDEOS.map((vid, idx) => (
              <button
                key={vid.id}
                onClick={() => setActiveFeaturedVideoIndex(idx)}
                className={cn(
                  'text-xs px-3.5 py-2 rounded-xl font-medium transition-all text-left flex items-center space-x-2 border',
                  activeFeaturedVideoIndex === idx
                    ? 'bg-civic-forest text-white border-civic-forest shadow-soft-raised'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/60'
                )}
              >
                <Play className="w-3 h-3 flex-shrink-0" />
                <span>{vid.topic}</span>
              </button>
            ))}
          </div>

          {/* Player & Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Interactive Video Embed Container */}
            <div className="lg:col-span-7 aspect-video rounded-2xl overflow-hidden shadow-soft-raised border border-emerald-900/15 relative bg-slate-900">
              <iframe
                key={currentFeaturedVideo.embedUrl}
                title={currentFeaturedVideo.title}
                src={`${currentFeaturedVideo.embedUrl}?rel=0`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video Takeaways & Links */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {currentFeaturedVideo.topic}
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {currentFeaturedVideo.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {currentFeaturedVideo.summary}
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                  Core Learning Takeaways:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {currentFeaturedVideo.keyTakeaways.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-1 flex flex-wrap gap-2.5">
                <a
                  href={currentFeaturedVideo.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-civic-forest text-white shadow-soft-raised hover:bg-civic-forestHover transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Watch on YouTube
                </a>

                <button
                  onClick={() => {
                    const resourceMatch = EDUCATIONAL_RESOURCES.find(
                      (r) => r.id === currentFeaturedVideo.id
                    );
                    if (resourceMatch) setActiveModalItem(resourceMatch);
                  }}
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-civic-forest border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-soft-raised"
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                  Read Full Synopsis
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Citizen Action Checklist: Practical Habits */}
      {(selectedCategory === 'ALL' || selectedCategory === 'SEGREGATION') && (
        <section className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-slate-50 rounded-3xl border border-emerald-100/80 shadow-soft-raised p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-civic-forest">
                <CheckCircle2 className="w-3.5 h-3.5 text-civic-emerald" />
                <span>Daily Civic Habits</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950">
                Barangay Sabang Citizen Action Checklist
              </h2>
              <p className="text-xs text-slate-600">
                Six simple household practices that keep our purok streets clean, pest-free, and compliant with RA 9003
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-white/90 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto shadow-sm">
              Discipline at Source
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {CITIZEN_ACTION_CHECKLIST.map((habit) => {
              const Icon = habit.icon;
              return (
                <div
                  key={habit.id}
                  className="bg-white/95 rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-soft-raised transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-civic-forest bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {habit.badge}
                      </span>
                      <Icon className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">
                      {habit.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {habit.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Interactive Segregation Matrix (Pillar 2: Tactile Color-Coded Bins) */}
      {(selectedCategory === 'ALL' || selectedCategory === 'SEGREGATION') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-civic-slate flex items-center">
                <Recycle className="w-4 h-4 mr-2 text-civic-emerald" />
                Barangay Sabang Waste Segregation Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Official 4-stream color-coded classification under RA 9003 and Barangay Council ordinances
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              No Segregation, No Collection
            </span>
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
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', bin.headerBadge)}>
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

                    <div className="bg-black/5 rounded-xl p-2.5 border border-black/5 text-[11px] font-medium">
                      {bin.ruleNotice}
                    </div>

                    <div className="space-y-1.5 pt-1">
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

                  <div className="pt-3 border-t border-black/10 mt-4 space-y-1">
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
              Browse guides covering RA 9003 legal mandates, collection discipline, DIY composting, eco-bricking, and UN SDGs
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
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
                className="bg-[#FAFDFB] rounded-2xl border border-slate-200/70 shadow-soft-raised p-5 flex flex-col justify-between hover:shadow-soft-raised-lg transition-all duration-200"
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

                  {item.sourceName && (
                    <div className="pt-2 flex items-center text-[10px] text-slate-500 font-medium">
                      <Globe className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{item.sourceName}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {item.type === 'video' && (item.externalWatchUrl || item.videoUrl) ? (
                    <a
                      href={item.externalWatchUrl || item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Watch video: ${item.title}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors shadow-soft-raised"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                      Watch Video
                      <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                    </a>
                  ) : item.articleUrl ? (
                    <a
                      href={item.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read guide: ${item.title}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors shadow-soft-raised"
                    >
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                      Read Guide
                      <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                    </a>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-800 flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                      Read Guide
                    </span>
                  )}
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

      {/* Community Waste Governance FAQ Section */}
      <section className="bg-[#FAFDFB] rounded-3xl border border-slate-200/80 shadow-soft-raised p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-civic-forest">
              <HelpCircle className="w-3.5 h-3.5 text-civic-emerald" />
              <span>Civic Knowledge Base</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Frequently Asked Community Waste Questions (FAQs)
            </h2>
            <p className="text-xs text-slate-500">
              Official legal policies, collection rules, and citizen guidelines in Barangay Sabang, Lipa City
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            {CIVIC_FAQS.length} Key Policies
          </span>
        </div>

        <div className="space-y-2.5 pt-1">
          {CIVIC_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-emerald-50/50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-civic-forest flex items-center justify-center font-mono text-xs mr-2.5 flex-shrink-0">
                      {idx + 1}
                    </span>
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    <p className="pl-8.5">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Community Environmental Benchmarks & MRF Operations Card */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-soft-raised relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
              Barangay Sabang Sustainability Targets
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Community Waste Diversion &amp; Climate Action Framework
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Under our 10-Year Solid Waste Management Plan in accordance with Section 16 of RA 9003, Barangay Sabang actively monitors diversion, source discipline, and composting operations.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">≥ 45%</span>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Landfill Diversion Target</span>
              <p className="text-[10px] text-slate-400 leading-tight">Diverted via MRF recovery and home composting</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
              <span className="text-xl sm:text-2xl font-black text-blue-300 font-mono">4 Streams</span>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Mandatory Sorting</span>
              <p className="text-[10px] text-slate-400 leading-tight">Biodegradable, Recyclable, Residual &amp; Hazardous</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">Zero</span>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Open Burning Tolerance</span>
              <p className="text-[10px] text-slate-400 leading-tight">100% ban on residential pagsisiga (RA 8749)</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
              <span className="text-xl sm:text-2xl font-black text-teal-300 font-mono">SAB-Points</span>
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Civic Incentives</span>
              <p className="text-[10px] text-slate-400 leading-tight">Gamified rewards for clean community sorting</p>
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Reader / Video Modal Dialog */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="neu-modal rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200/70 shadow-neu-raised space-y-5 my-8 max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-2">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-soft-raised border border-slate-300 bg-slate-900">
                  <iframe
                    title={activeModalItem.title}
                    src={`${activeModalItem.videoUrl}?rel=0`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {(activeModalItem.externalWatchUrl || activeModalItem.videoUrl) && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-500 font-medium">Official Video Link</span>
                    <a
                      href={activeModalItem.externalWatchUrl || activeModalItem.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
                    >
                      <Play className="w-3 h-3 mr-1.5 fill-current" />
                      Watch Video on YouTube
                      <ExternalLink className="w-3 h-3 ml-1.5 opacity-80" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Reading Content */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {activeModalItem.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* If Article with verified URL: Render Reliable Source Banner */}
            {activeModalItem.type === 'article' && activeModalItem.articleUrl && (
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft-pressed">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Verified Reliable Internet Source
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {activeModalItem.sourceName || 'Official External Reference'}
                  </p>
                </div>
                <a
                  href={activeModalItem.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-civic-forest text-white hover:bg-civic-forestHover transition-colors shadow-soft-raised self-start sm:self-auto flex-shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Read Full Official Source
                </a>
              </div>
            )}

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
