'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  CreditCard,
  BookOpen,
  Award,
  ShieldCheck,
  Gift,
} from 'lucide-react';

export default function StudentDetailView({ id }: { id: string }) {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('course-1');
  const [grantReason, setGrantReason] = useState('');
  const [submittingGrant, setSubmittingGrant] = useState(false);

  async function loadStudent() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/students/${id}`);
      const json = await res.json();
      if (json.success) {
        setStudent(json.student);
      }
    } catch (err) {
      console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, [id]);

  async function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!grantReason.trim()) return;
    try {
      setSubmittingGrant(true);
      const res = await fetch('/api/admin/enrollments/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: id,
          courseId: selectedCourseId,
          reason: grantReason,
          durationDays: 365,
        }),
      });
      if (res.ok) {
        setGrantModalOpen(false);
        setGrantReason('');
        loadStudent();
      }
    } catch (err) {
      console.error('Failed to grant access:', err);
    } finally {
      setSubmittingGrant(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading student record...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-700 font-semibold">Student record not found</p>
        <Link href="/admin/students" className="mt-4 inline-block">
          <Button variant="outline">Back to Students</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/students">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {student.full_name}
              </h1>
              <StatusBadge status={student.status} />
              {student.academic?.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Academic
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Student ID: <span className="font-mono">{student.id}</span> • Auth Identity: Clerk UUID
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            onClick={() => setGrantModalOpen(true)}
            className="gap-1.5"
          >
            <Gift className="h-4 w-4" />
            <span>Grant Complimentary Access</span>
          </Button>
        </div>
      </div>

      {/* Grid: Profile & Academic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact & Identity Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <span className="font-semibold text-slate-800">{student.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone
              </span>
              <span className="font-semibold text-slate-800">{student.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Member Since
              </span>
              <span className="font-semibold text-slate-800">{formatDateTime(student.created_at)}</span>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <p className="text-slate-500 mb-1 font-semibold">Admin Notes</p>
              <p className="p-2.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80 leading-relaxed text-[11px]">
                {student.adminNotes || 'No notes added yet.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Qualification Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#0B3473]" />
              <span>Verified Academic Background</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">College / University</span>
              <span className="font-bold text-slate-800">{student.academic?.collegeName || 'Not Set'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Degree & Specialization</span>
              <span className="font-semibold text-slate-800">{student.academic?.degree}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Academic Branch</span>
              <span className="font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0B3473] border border-blue-200">
                {student.academic?.branchCode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Passing Year</span>
              <span className="font-semibold text-slate-800">{student.academic?.passedOutYear}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">University Roll No.</span>
              <span className="font-mono text-slate-800">{student.academic?.rollNumber}</span>
            </div>
            <div className="pt-2 text-[11px] text-slate-500">
              Verified by: <span className="font-semibold">{student.academic?.verifiedBy}</span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Entitlements Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#16A36A]" />
              <span>Subscription & Entitlements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            {student.subscriptions && student.subscriptions.length > 0 ? (
              student.subscriptions.map((sub: any) => (
                <div key={sub.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{sub.planName}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ID: {sub.razorpay_subscription_id || sub.id}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Expires: {formatDateTime(sub.current_period_end)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No active subscription plan</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses Section */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#0B3473]" />
            <span>Enrolled Courses & Watch Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {(student.enrollments || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500">No course enrollments active.</div>
            ) : (
              student.enrollments.map((enr: any) => (
                <div key={enr.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{enr.courseTitle}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="capitalize font-semibold text-[#0B3473]">
                        {enr.access_type.replace(/_/g, ' ')}
                      </span>
                      <span>•</span>
                      <span>Enrolled: {formatDateTime(enr.enrolled_at)}</span>
                      {enr.expires_at && (
                        <>
                          <span>•</span>
                          <span>Expires: {formatDateTime(enr.expires_at)}</span>
                        </>
                      )}
                    </div>
                    {enr.grant_reason && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        Reason: {enr.grant_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-36">
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="text-slate-900">{enr.progress_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-[#0B3473] h-2 rounded-full"
                          style={{ width: `${enr.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>
                    <StatusBadge status={enr.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grant Complimentary Access Modal */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Complimentary Access</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGrantAccess} className="space-y-4 pt-2">
            <div>
              <Label>Select Engineering Course</Label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B3473]"
              >
                <option value="course-1">Full Stack Next.js & React Enterprise Masterclass</option>
                <option value="course-2">Applied Generative AI & Large Language Models</option>
                <option value="course-3">VLSI Chip Design and SystemVerilog Verification</option>
                <option value="course-4">Cloud DevOps & Kubernetes for Engineers</option>
              </select>
            </div>

            <div>
              <Label>Administrative Grant Reason (Required for Audit Log)</Label>
              <Input
                placeholder="e.g. Merit scholarship, College batch waiver, Hackathon winner"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGrantModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submittingGrant}>
                {submittingGrant ? 'Granting...' : 'Grant Access'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

