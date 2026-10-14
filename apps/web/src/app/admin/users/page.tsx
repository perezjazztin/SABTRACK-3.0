'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute
      requiredRole="BARANGAY_ADMIN"
      moduleName="User &amp; Access Management"
    >
      <ModulePlaceholder
        title="User &amp; Access Role Management"
        portalType="Barangay Administrative Portal"
        plannedPhase="Phase 2 Foundation Verification"
        description="Controlled provisioning of barangay reviewer accounts, inspection of role-based access controls, and security audit log review."
        requiredPermission="users:manage"
        icon={Users}
        features={[
          'Strict least-privilege role assignment (Staff, Admin, Maintainer)',
          'Controlled development test account creation (no unrestricted registration)',
          'Account deactivation and active session invalidation controls',
          'Security audit log review tracking login successes, failures, and access denials',
        ]}
      />
    </ProtectedRoute>
  );
}
