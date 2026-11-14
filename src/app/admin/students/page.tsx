'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  UserX,
  UserCheck,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetStudent, setTargetStudent] = useState<any>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | null>(null);

  async function fetchStudents() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (branchFilter) params.append('branch', branchFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [search, branchFilter, statusFilter]);

  async function handleStatusChange() {
    if (!targetStudent || !actionType) return;
    try {
      const newStatus = actionType === 'suspend' ? 'suspended' : 'active';
      const res = await fetch(`/api/admin/students/${targetStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: `Administrative ${actionType} action` }),
      });
      if (res.ok) {
        setTargetStudent(null);
        setActionType(null);
        fetchStudents();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  }

  function handleExportCsv() {
    window.open('/api/admin/students?format=csv', '_blank');
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="text-sm text-slate-500">
            Verified student accounts, academic records, course access and subscription entitlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5 border-slate-200">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by student name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B3473]"
              >
                <option value="">All Academic Branches</option>
                <option value="CSE">CSE - Computer Science</option>
                <option value="ECE">ECE - Electronics & Comm</option>
                <option value="AIML">AIML - AI & Machine Learning</option>
                <option value="IT">IT - Information Tech</option>
                <option value="MECH">MECH - Mechanical</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B3473]"
              >
                <option value="">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-4 py-3.5">Branch & Institution</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Enrolled Courses</th>
                  <th className="px-4 py-3.5">Total Paid</th>
                  <th className="px-4 py-3.5">Registration</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading student roster...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No students found matching your filters.
                    </td>
                  </tr>
                ) : (
                  students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#0B3473]/10 text-[#0B3473] flex items-center justify-center font-bold text-sm shrink-0">
                            {st.fullName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/admin/students/${st.id}`}
                              className="font-bold text-slate-900 hover:text-[#0B3473] hover:underline"
                            >
                              {st.fullName}
                            </Link>
                            <p className="text-xs text-slate-500">{st.email}</p>
                            <p className="text-[11px] text-slate-400">{st.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-[#0B3473] border border-blue-200">
                          {st.branch}
                        </span>
                        <p className="text-xs text-slate-600 mt-1">{st.college}</p>
                        <p className="text-[11px] text-slate-400">Class of {st.passedOutYear}</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={st.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-semibold text-slate-900">
                          {st.enrolledCoursesCount} Courses
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Pass: <span className="font-medium text-slate-700 capitalize">{st.subscriptionStatus}</span>
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-900">
                        {formatCurrency(st.totalPaid)}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDateTime(st.registeredAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/students/${st.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-[#0B3473]" title="View Dossier">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {st.status === 'active' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-red-600 hover:bg-red-50"
                              title="Suspend Student Account"
                              onClick={() => {
                                setTargetStudent(st);
                                setActionType('suspend');
                              }}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 hover:bg-emerald-50"
                              title="Activate Student Account"
                              onClick={() => {
                                setTargetStudent(st);
                                setActionType('activate');
                              }}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {targetStudent && actionType && (
        <ConfirmDialog
          open={Boolean(targetStudent)}
          onOpenChange={(open) => !open && setTargetStudent(null)}
          title={`${actionType === 'suspend' ? 'Suspend' : 'Activate'} Account`}
          description={`Are you sure you want to ${actionType} the student account for ${targetStudent.fullName}? This will be recorded in the security audit trail.`}
          confirmLabel={actionType === 'suspend' ? 'Suspend Account' : 'Activate Account'}
          isDestructive={actionType === 'suspend'}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}

