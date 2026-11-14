'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import {
  FileCheck2,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';

export default function CertificatesManagementPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('s1');
  const [courseId, setCourseId] = useState('course-1');
  const [submitting, setSubmitting] = useState(false);

  async function loadCertificates() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/certificates');
      const json = await res.json();
      if (json.success) {
        setCertificates(json.data);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, course_id: courseId }),
      });
      if (res.ok) {
        setIssueModalOpen(false);
        loadCertificates();
      }
    } catch (err) {
      console.error('Failed to issue certificate:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Certified Credentials & Digital Degrees
          </h1>
          <p className="text-sm text-slate-500">
            Issue cryptographically verified engineering certificates with public verification hashes and QR code auditability.
          </p>
        </div>
        <Button
          onClick={() => setIssueModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Issue Verified Certificate</span>
        </Button>
      </div>

      {/* Certificates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Verification Code</th>
                  <th className="px-6 py-3.5">Recipient Student</th>
                  <th className="px-6 py-3.5">Engineering Course</th>
                  <th className="px-4 py-3.5">Issue Date</th>
                  <th className="px-4 py-3.5">Verification Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading issued certificates...
                    </td>
                  </tr>
                ) : (
                  certificates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[#0B3473]">
                        {c.certificate_code}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900">{c.studentName}</p>
                        <p className="text-[11px] text-slate-400">{c.studentEmail}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {c.courseTitle}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDateTime(c.issue_date)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Tamper-Proof
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(c.pdf_url, '_blank')}
                          className="h-8 text-xs text-[#0B3473]"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          View PDF
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Issue Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Verified Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssue} className="space-y-4 pt-2">
            <div>
              <Label>Student</Label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
              >
                <option value="s1">Arjun Patel (arjun.patel@gmail.com)</option>
                <option value="s2">Priya Nair (priya.nair@gmail.com)</option>
                <option value="s3">Rohit Deshmukh (rohit.deshmukh@yahoo.com)</option>
              </select>
            </div>
            <div>
              <Label>Course Completed</Label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
              >
                <option value="course-1">Full Stack Next.js Masterclass</option>
                <option value="course-2">Applied Generative AI & LLMs</option>
                <option value="course-3">VLSI Chip Design and SystemVerilog</option>
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Generating...' : 'Issue Certificate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

