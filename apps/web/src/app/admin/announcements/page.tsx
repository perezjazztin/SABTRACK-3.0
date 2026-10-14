'use client';

import React from 'react';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Megaphone } from 'lucide-react';

export default function AdminAnnouncementsPage() {
  return (
    <ModulePlaceholder
      title="Official Announcements &amp; Bulletin Publisher"
      portalType="Barangay Administrative Portal"
      plannedPhase="Phase 3 — Core Waste Operations"
      description="Draft, schedule, publish, and archive official Barangay Sabang environmental bulletins, ecological notices, and holiday collection changes."
      requiredPermission="announcements:manage"
      icon={Megaphone}
      features={[
        'WYSIWYG announcement composer with publication date boundaries',
        'Targeted announcement broadcasting (all barangay vs. specific puroks)',
        'Educational material publisher explaining RA 9003 waste segregation rules',
        'Notification event generation for subscribed residents',
      ]}
    />
  );
}
