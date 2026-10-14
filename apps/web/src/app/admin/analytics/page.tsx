'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <ProtectedRoute
      requiredRole="BARANGAY_ADMIN"
      moduleName="Executive Business Analytics"
    >
      <ModulePlaceholder
        title="Business Analytics &amp; Decision Support"
        portalType="Barangay Administrative Portal"
        plannedPhase="Phase 5 — Analytics & Decision Support"
        description="The multi-step analytics procedure aggregating operational records into verified indicators, recurring waste violation hotspots, and plain-language summaries."
        requiredPermission="analytics:read"
        icon={BarChart3}
        features={[
          'The 6-step analytics pipeline: Ingest → Sanitize → Aggregate → Detect → Visualize → Support',
          'Key Indicators: Median resolution hours, recurring purok clusters, category distributions',
          'Data hygiene caveats distinguishing reporting frequency from physical incident prevalence',
          'Optional bounded AI insight generator consuming curated numerical aggregates only',
        ]}
      />
    </ProtectedRoute>
  );
}
