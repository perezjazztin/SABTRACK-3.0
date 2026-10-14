'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { LayoutDashboard } from 'lucide-react';

export default function AdminOverviewPage() {
  return (
    <ModulePlaceholder
      title="Administrative Command Overview"
      portalType="Barangay Administrative Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="Executive operational summary of active complaint queues, schedule publication statuses, verified clean-up participation counts, and critical barangay alerts."
      requiredPermission="profile:read:self"
      icon={LayoutDashboard}
      features={[
        'Actionable KPI summary cards: Pending Reports, Reports In Progress, Median Resolution Days',
        'Quick review drawer for newly submitted uncollected waste and violation reports',
        'Audit log monitor recording privileged administrative status transitions',
        'System health indicator and PostgreSQL database connectivity check',
      ]}
    />
  );
}
