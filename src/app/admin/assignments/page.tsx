'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import {
  FileText,
  Plus,
  CheckSquare,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function AssignmentsManagementPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('course-1');
  const [instructions, setInstructions] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  async function loadAssignments() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/assignments');
      const json = await res.json();
      if (json.success) {
        setAssignments(json.data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          course_id: courseId,
          instructions,
          max_marks: maxMarks,
        }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setTitle('');
        setInstructions('');
        loadAssignments();
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
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
            Capstone Assignments & Projects
          </h1>
          <p className="text-sm text-slate-500">
            Configure practical engineering assignments, code review rubrics, and grade student submissions.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Assignment</span>
        </Button>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Assignment Title</th>
                  <th className="px-6 py-3.5">Course</th>
                  <th className="px-4 py-3.5">Max Marks</th>
                  <th className="px-4 py-3.5">Submissions</th>
                  <th className="px-4 py-3.5">Pending Grading</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading assignments...
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900">{a.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.instructions}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {a.courseTitle}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-900">
                        {a.max_marks} pts
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {a.submissions_count || 38} Submissions
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {a.pendingReviewsCount} to Grade
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {a.due_date ? formatDateTime(a.due_date) : 'Rolling'}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={a.is_published ? 'published' : 'draft'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Assignment Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Course Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAssignment} className="space-y-4 pt-2">
            <div>
              <Label>Assignment Title</Label>
              <Input
                placeholder="e.g. Design an FPGA SystemVerilog Testbench"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Associated Course</Label>
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
            <div>
              <Label>Submission Instructions</Label>
              <Textarea
                placeholder="Repository link format, deliverables and testing guidelines"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Maximum Marks</Label>
              <Input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

