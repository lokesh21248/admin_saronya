'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle,
  FileQuestion,
  Award,
} from 'lucide-react';

export default function AssessmentsManagementPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('course-1');
  const [passPct, setPassPct] = useState('75');
  const [timeLimit, setTimeLimit] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  async function loadQuizzes() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/assessments');
      const json = await res.json();
      if (json.success) {
        setQuizzes(json.data);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          course_id: courseId,
          pass_percentage: passPct,
          time_limit_minutes: timeLimit,
        }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setTitle('');
        loadQuizzes();
      }
    } catch (err) {
      console.error('Failed to create quiz:', err);
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
            Assessments & Examination Manager
          </h1>
          <p className="text-sm text-slate-500">
            Interactive quizzes, multi-format questions, timed exams and automated certification thresholds.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Assessment</span>
        </Button>
      </div>

      {/* Quizzes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Assessment Title</th>
                  <th className="px-6 py-3.5">Associated Course</th>
                  <th className="px-4 py-3.5">Passing Score</th>
                  <th className="px-4 py-3.5">Time Limit</th>
                  <th className="px-4 py-3.5">Student Attempts</th>
                  <th className="px-4 py-3.5">Pass Rate</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading assessments...
                    </td>
                  </tr>
                ) : (
                  quizzes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900">{q.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{q.questions_count} Questions</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {q.courseTitle}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-[#0B3473]">
                        {q.pass_percentage}%
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {q.time_limit_minutes} mins
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {q.attemptsCount} attempts
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-emerald-700">
                        {q.passRatePct}% Passed
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={q.is_published ? 'published' : 'draft'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Quiz Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Course Assessment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateQuiz} className="space-y-4 pt-2">
            <div>
              <Label>Quiz Title</Label>
              <Input
                placeholder="e.g. Distributed Database Architecture Assessment"
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Pass Percentage (%)</Label>
                <Input
                  type="number"
                  value={passPct}
                  onChange={(e) => setPassPct(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label>Time Limit (Minutes)</Label>
                <Input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

