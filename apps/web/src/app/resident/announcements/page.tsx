'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Bell } from 'lucide-react';

export default function ResidentAnnouncementsPage() {
  return (
    <ModulePlaceholder
      title="Official Barangay Advisories"
      portalType="Resident Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="Official solid waste management notices, ecological guidelines, holiday collection shifts, and environmental announcements published by Barangay Sabang."
      requiredPermission="profile:read:self"
      icon={Bell}
      features={[
        'Verified bulletins published directly by the Barangay Council',
        'Filtering by category: Holiday Schedules, Emergency Alerts, Clean-up Drives',
        'Searchable archive of past solid waste policies under Republic Act 9003',
      ]}
    />
  );
}
