'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth-context';
import {
  getUsers,
  createUser,
  updateUserStatus,
  updateUserRole,
} from '@/lib/api-client';
import { AdminUserItem, UserCreatePayload } from '@/types/users';
import { UserRole } from '@/types/auth';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Mail,
  UserCheck,
  ShieldAlert,
  X,
  Eye,
} from 'lucide-react';

const ROLE_BADGES: Record<
  UserRole,
  { label: string; bg: string; text: string; border: string }
> = {
  RESIDENT: {
    label: 'Resident',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  BARANGAY_STAFF: {
    label: 'Barangay Staff',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  BARANGAY_ADMIN: {
    label: 'Barangay Admin',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  SYSTEM_MAINTAINER: {
    label: 'System Maintainer',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'BARANGAY_ADMIN';
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserCreatePayload>({
    email: '',
    password: '',
    full_name: '',
    role: 'BARANGAY_STAFF',
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers({
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        isActive:
          statusFilter === 'ACTIVE'
            ? true
            : statusFilter === 'DEACTIVATED'
            ? false
            : undefined,
        search: search.trim() || undefined,
      });
      setUsers(res.items || []);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load user directory';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = async (targetUser: AdminUserItem) => {
    if (targetUser.id === currentUser?.id && targetUser.is_active) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    const action = targetUser.is_active ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} ${targetUser.full_name}?`)) {
      return;
    }

    try {
      await updateUserStatus(targetUser.id, !targetUser.is_active);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  const handleRoleChange = async (targetUser: AdminUserItem, newRole: UserRole) => {
    if (targetUser.id === currentUser?.id && newRole !== 'BARANGAY_ADMIN') {
      alert('You cannot revoke your own administrative privileges.');
      return;
    }

    try {
      await updateUserRole(targetUser.id, newRole);
      await loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createUser(formData);
      setIsCreateOpen(false);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'BARANGAY_STAFF',
      });
      await loadUsers();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to provision account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI Calculations
  const totalCount = users.length;
  const staffAdminCount = users.filter((u) =>
    ['BARANGAY_STAFF', 'BARANGAY_ADMIN'].includes(u.role)
  ).length;
  const residentCount = users.filter((u) => u.role === 'RESIDENT').length;
  const deactivatedCount = users.filter((u) => !u.is_active).length;

  return (
    <ProtectedRoute
      requiredRole={['BARANGAY_STAFF', 'BARANGAY_ADMIN']}
      moduleName="User & Access Management"
    >
      <div className="space-y-8">
        {/* Executive Header */}
        <div className="neu-card rounded-3xl border border-slate-200/70 p-7 sm:p-8 shadow-neu-raised flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-emerald-100 text-civic-forest rounded-xl shadow-neu-xs">
                <Users className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-civic-slate tracking-tight">
                User &amp; Personnel Governance
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isAdmin
                ? 'Least-Privilege Role Provisioning • Deactivation Controls • Barangay Sabang'
                : 'Barangay Sabang Personnel & Resident Directory (View-Only Access)'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-civic-forest hover:bg-civic-forestHover transition-colors shadow-neu-green"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Provision Account
              </button>
            )}
            <button
              onClick={loadUsers}
              disabled={loading}
              className="neu-button inline-flex items-center p-2.5 rounded-xl text-slate-600 transition-colors shadow-neu-raised disabled:opacity-50"
              title="Refresh roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Staff View-Only Access Banner */}
        {!isAdmin && (
          <div className="flex items-center gap-3 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-blue-900 text-xs shadow-neu-xs">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl flex-shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Staff View-Only Access Mode</p>
              <p className="text-blue-700/90 text-[11px] mt-0.5">
                You are viewing the registered user directory in read-only mode. Provisioning new accounts, changing user roles, and toggling active/deactivation status requires Barangay Administrator authorization.
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-mono font-semibold border border-blue-200">
              Read-Only
            </span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <div className="neu-card rounded-3xl border border-slate-200/70 p-6 shadow-neu-raised space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Accounts
            </span>
            <div className="text-3xl font-black text-civic-slate">{totalCount}</div>
            <p className="text-[11px] text-slate-400">System identities on record</p>
          </div>

          <div className="neu-card rounded-3xl border border-slate-200/70 p-6 shadow-neu-raised space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Barangay Personnel
            </span>
            <div className="text-2xl font-black text-purple-700">{staffAdminCount}</div>
            <p className="text-[11px] text-slate-400">Staff review &amp; Admin council</p>
          </div>

          <div className="neu-card rounded-3xl border border-slate-200/70 p-6 shadow-neu-raised space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Community Residents
            </span>
            <div className="text-2xl font-black text-emerald-700">{residentCount}</div>
            <p className="text-[11px] text-slate-400">Verified reporting citizens</p>
          </div>

          <div className="neu-card rounded-3xl border border-slate-200/70 p-6 shadow-neu-raised space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Deactivated Access
            </span>
            <div className="text-2xl font-black text-rose-600">{deactivatedCount}</div>
            <p className="text-[11px] text-slate-400">Revoked / Suspended accounts</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="neu-card rounded-3xl border border-slate-200/70 p-5 shadow-neu-raised flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by full name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neu-input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="neu-select px-3.5 py-2.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-civic-forest"
            >
              <option value="ALL">All Roles</option>
              <option value="RESIDENT">Residents</option>
              <option value="BARANGAY_STAFF">Barangay Staff</option>
              <option value="BARANGAY_ADMIN">Barangay Admin</option>
              <option value="SYSTEM_MAINTAINER">System Maintainer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neu-select px-3.5 py-2.5 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-civic-forest"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DEACTIVATED">Deactivated Only</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadUsers} className="font-bold underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* User Roster Table */}
        <div className="neu-card rounded-3xl border border-white/80 shadow-neu-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e4ecf3] border-b border-white/80 text-slate-800 font-black uppercase tracking-wider text-[11px] shadow-neu-xs">
                <tr>
                  <th className="py-4 px-5">User</th>
                  <th className="py-4 px-5">Role Assignment</th>
                  <th className="py-4 px-5">Account Status</th>
                  <th className="py-4 px-5">Created Date</th>
                  <th className="py-4 px-5 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading user personnel directory...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No accounts found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleBadge = ROLE_BADGES[u.role] || ROLE_BADGES.RESIDENT;
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-800">{u.full_name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <span>{u.email}</span>
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {isAdmin ? (
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border} focus:outline-none disabled:opacity-80`}
                            >
                              <option value="RESIDENT">Resident</option>
                              <option value="BARANGAY_STAFF">Barangay Staff</option>
                              <option value="BARANGAY_ADMIN">Barangay Admin</option>
                              <option value="SYSTEM_MAINTAINER">System Maintainer</option>
                            </select>
                          ) : (
                            <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-lg border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                              {roleBadge.label}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf && u.is_active}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                                u.is_active
                                  ? 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed'
                                  : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono border border-slate-200">
                              View Only
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Provisioning Modal */}
        {isAdmin && isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="neu-card rounded-3xl border border-slate-200/70 shadow-neu-raised max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-civic-forest" />
                  <h2 className="text-sm font-bold text-civic-slate">
                    Provision System Account
                  </h2>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Kagawad Maria Santos"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="maria.santos@sabtrack.local"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Assign Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                    className="neu-select w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  >
                    <option value="BARANGAY_STAFF">Barangay Staff (Complaint Reviewer)</option>
                    <option value="BARANGAY_ADMIN">Barangay Admin (Full Council Privileges)</option>
                    <option value="RESIDENT">Resident (Reporting &amp; Gamification)</option>
                    <option value="SYSTEM_MAINTAINER">System Maintainer (Diagnostics Only)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="neu-input w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-civic-forest"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="neu-btn-secondary px-4 py-2 rounded-xl text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-civic-forest hover:bg-civic-forestHover text-white font-bold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Provisioning...' : 'Confirm Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
