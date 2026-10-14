'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { FileText } from 'lucide-react';

export default function ResidentReportsPage() {
  return (
    <ModulePlaceholder
      title="My Waste Reports & Concerns"
      portalType="Resident Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="Track the status and official resolution notes for all violation and uncollected garbage concerns you have submitted to Barangay Sabang."
      requiredPermission="reports:read:self"
      icon={FileText}
      features={[
        'Full timeline of past submissions with status history and timestamps',
        'Official feedback and resolution notes from Barangay Reviewers',
        'Mobile-friendly report creation wizard with secure photo evidence uploads',
        'Strict complainant confidentiality and EXIF GPS coordinate sanitization',
      ]}
    />
  );
}
