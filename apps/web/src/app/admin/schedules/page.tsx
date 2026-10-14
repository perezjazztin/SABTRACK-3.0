'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { CalendarDays } from 'lucide-react';

export default function AdminSchedulesPage() {
  return (
    <ProtectedRoute
      requiredRole="BARANGAY_ADMIN"
      moduleName="Collection Schedule Administration"
    >
      <ModulePlaceholder
        title="Collection Schedule Administration"
        portalType="Barangay Administrative Portal"
        plannedPhase="Phase 3 — Core Waste Operations"
        description="Create, update, and publish official garbage collection timetables by purok/zone, broadcast emergency route change advisories, and track modification histories."
        requiredPermission="schedules:manage"
        icon={CalendarDays}
        features={[
          'Purok-by-purok pickup schedule creator with day/time slot management',
          'Segregation rule configuration (Biodegradable vs. Non-Biodegradable days)',
          'Emergency route change and collection delay alert broadcaster',
          'Full version-controlled audit trail of schedule modifications',
        ]}
      />
    </ProtectedRoute>
  );
}
