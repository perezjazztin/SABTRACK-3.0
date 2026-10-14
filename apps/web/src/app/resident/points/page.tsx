'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Award } from 'lucide-react';

export default function ResidentPointsPage() {
  return (
    <ModulePlaceholder
      title="SAB-Points Community Engagement"
      portalType="Resident Portal"
      plannedPhase="Phase 4 — Verified Engagement"
      description="Record and track verified resident participation in barangay environmental initiatives, clean-up drives, and waste segregation programs."
      requiredPermission="profile:read:self"
      icon={Award}
      features={[
        'Immutable double-entry transaction ledger showing earned and redeemed points',
        'Submission of participation claims with event evidence for official review',
        'Official barangay verification badge and points ledger reconciliation',
        'Academic demonstration of civic gamification (no real-world monetary procurement)',
      ]}
    />
  );
}
