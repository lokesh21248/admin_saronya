'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { formatDateTime } from '@/lib/utils';
import {
  BookMarked,
  Search,
  Gift,
  Ban,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function EnrollmentsManagementPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<any>(null);

  async function loadEnrollments() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (accessTypeFilter) params.append('accessType', accessTypeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/enrollments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEnrollments(json.data);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEnrollments();
  }, [search, accessTypeFilter, statusFilter]);

  async function handleRevoke() {
    if (!revokeTarget) return;
    try {
      const res = await fetch('/api/admin/enrollments/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: revokeTarget.id, reason: 'Administrative revocation' }),
      });
      if (res.ok) {
        setRevokeTarget(null);
        loadEnrollments();
      }
    } catch (err) {
      console.error('Error revoking:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Course Enrollment Roster
          </h1>
          <p className="text-sm text-slate-500">
            Audit individual purchases, active subscription course entitlements, and complimentary access grants.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search student or course title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={accessTypeFilter}
                onChange={(e) => setAccessTypeFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700"
              >
                <option value="">All Access Types</option>
                <option value="individual_purchase">Individual Purchase</option>
                <option value="subscription_monthly">Monthly Pass</option>
                <option value="subscription_quarterly">Quarterly Pass</option>
                <option value="subscription_annual">Annual Pass</option>
                <option value="complimentary">Complimentary Grant</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Course Enrolled</th>
                  <th className="px-4 py-3.5">Access Type</th>
                  <th className="px-4 py-3.5">Progress</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Enrolled Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading enrollments...
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/students/${enr.student_id}`}
                          className="font-bold text-slate-900 hover:text-[#0B3473] text-xs hover:underline block"
                        >
                          {enr.studentName}
                        </Link>
                        <span className="text-[11px] text-slate-400">{enr.studentEmail}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                        {enr.courseTitle}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#0B3473] capitalize border border-blue-200">
                          {enr.access_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] font-bold mb-1 text-slate-600">
                            <span>{enr.progress_percentage || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-[#0B3473] h-1.5 rounded-full"
                              style={{ width: `${enr.progress_percentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={enr.status} />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDateTime(enr.enrolled_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {enr.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokeTarget(enr)}
                            className="h-8 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Revocation Confirm Dialog */}
      {revokeTarget && (
        <ConfirmDialog
          open={Boolean(revokeTarget)}
          onOpenChange={(open) => !open && setRevokeTarget(null)}
          title="Revoke Student Course Access"
          description={`Are you sure you want to revoke access to "${revokeTarget.courseTitle}" for ${revokeTarget.studentName}? This revocation will be recorded in the security audit trail.`}
          confirmLabel="Revoke Course Access"
          isDestructive={true}
          onConfirm={handleRevoke}
        />
      )}
    </div>
  );
}

