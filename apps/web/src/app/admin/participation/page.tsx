'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Award } from 'lucide-react';

export default function AdminParticipationPage() {
  return (
    <ModulePlaceholder
      title="SAB-Points Verification &amp; Cleanliness Initiatives"
      portalType="Barangay Administrative Portal"
      plannedPhase="Phase 4 — Verified Engagement"
      description="Review resident participation evidence from community clean-up drives, approve point awards to the immutable ledger, and monitor engagement trends."
      requiredPermission="participation:review"
      icon={Award}
      features={[
        'Clean-up drive activity creator with point award definitions and date bounds',
        'Resident participation claims review queue with evidence photo verification',
        'Official verification logging and transactional point ledger issuance',
        'Reconciliation tools preventing point duplication or balance tampering',
      ]}
    />
  );
}
