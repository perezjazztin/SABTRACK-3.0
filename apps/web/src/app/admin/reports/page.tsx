'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { FileCheck2 } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <ModulePlaceholder
      title="Waste Report Review & Verification Queue"
      portalType="Barangay Administrative Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="Manage and process resident violation and uncollected waste reports with complete status history tracking, evidence review, and resolution documentation."
      requiredPermission="reports:review"
      icon={FileCheck2}
      features={[
        'Filterable queue by status (Pending Review, In Progress, Needs More Info, Resolved, Rejected)',
        'Detailed evidence viewer for photo attachments and validated coordinates',
        'Mandatory status change notes and timestamped audit logging',
        'Automated resident status notification trigger',
      ]}
    />
  );
}
