'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Calendar } from 'lucide-react';

export default function ResidentSchedulesPage() {
  return (
    <ModulePlaceholder
      title="Garbage Collection Schedules"
      portalType="Resident Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="View official garbage collection schedules by purok or sector, track route change notices, and subscribe to automated collection reminders."
      requiredPermission="profile:read:self"
      icon={Calendar}
      features={[
        'Interactive weekly calendar organized by validated purok or zone',
        'Biodegradable vs. Non-biodegradable segregation collection timetable',
        'Official delay and truck route change advisories issued by barangay officials',
        'Email notification subscription preferences',
      ]}
    />
  );
}
