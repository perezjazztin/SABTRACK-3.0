'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { LayoutDashboard } from 'lucide-react';

export default function ResidentDashboardPage() {
  return (
    <ModulePlaceholder
      title="Resident Overview & Activity"
      portalType="Resident Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="The centralized citizen home screen showing next garbage collection times, emergency advisories, submitted report status summaries, and clean-up drive highlights."
      requiredPermission="profile:read:self"
      icon={LayoutDashboard}
      features={[
        'Next pickup schedule widget mapped to resident’s registered purok/zone',
        'Quick-action button for geo-tagged community report submission',
        'Recent report status tracker (Pending Review, In Progress, Resolved)',
        'Barangay Sabang solid waste announcements feed',
      ]}
    />
  );
}
