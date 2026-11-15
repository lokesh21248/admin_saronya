'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  BookOpen,
  Plus,
  Search,
  Layers,
  Clock,
  Video,
  CheckCircle2,
  Archive,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function CoursesListPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [publishTarget, setPublishTarget] = useState<any>(null);

  async function loadCourses() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCourses(json.data);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, [search, statusFilter]);

  async function handleTogglePublish() {
    if (!publishTarget) return;
    try {
      const nextStatus = publishTarget.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/courses/${publishTarget.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setPublishTarget(null);
        loadCourses();
      }
    } catch (err) {
      console.error('Failed to change publish status:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Course Management
          </h1>
          <p className="text-sm text-slate-500">
            Author engineering curricula, configure academic branch mapping, manage Mux video streaming and pricing tiers.
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2 bg-[#0B3473] hover:bg-[#082654]">
            <Plus className="h-4 w-4" />
            <span>Create Course (10-Step Wizard)</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Ribbon */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search engineering courses by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0B3473]"
              >
                <option value="">All Publication Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Loading course catalog...
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No courses found matching your criteria.
          </div>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col justify-between group">
              <div>
                {/* Course Thumbnail Image */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={course.thumbnail_url || '/placeholders/course-placeholder.svg'}
                    alt={course.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/placeholders/course-placeholder.svg';
                    }}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={course.status} />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                    {course.difficulty_level}
                  </div>
                </div>

                {/* Course Metadata */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0B3473]">
                    <span>{course.categoryName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {course.duration_hours} hrs
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.short_description || 'No description provided.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {formatCurrency(course.price)}
                      </span>
                      {course.discount_price && (
                        <span className="ml-1.5 text-[11px] text-slate-400 line-through">
                          {formatCurrency(course.discount_price)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Instructor: <span className="font-semibold text-slate-700">{course.instructorName}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Action Buttons */}
              <div className="p-4 pt-0 border-t border-slate-100/80 bg-slate-50/50 flex items-center justify-between gap-2 mt-4">
                <Link href={`/admin/courses/${course.id}/curriculum`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-200">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Curriculum</span>
                  </Button>
                </Link>

                <Button
                  variant={course.status === 'published' ? 'ghost' : 'default'}
                  size="sm"
                  onClick={() => setPublishTarget(course)}
                  className="text-xs"
                >
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Dialog for Publishing/Unpublishing */}
      {publishTarget && (
        <ConfirmDialog
          open={Boolean(publishTarget)}
          onOpenChange={(open) => !open && setPublishTarget(null)}
          title={publishTarget.status === 'published' ? 'Unpublish Course' : 'Publish Course Live'}
          description={`Are you sure you want to ${
            publishTarget.status === 'published' ? 'unpublish' : 'publish'
          } "${publishTarget.title}"? ${
            publishTarget.status === 'published'
              ? 'Students will no longer see this course in the public catalog.'
              : 'The course curriculum will become live for enrolled learners.'
          }`}
          confirmLabel={publishTarget.status === 'published' ? 'Unpublish Course' : 'Publish Now'}
          isDestructive={publishTarget.status === 'published'}
          onConfirm={handleTogglePublish}
        />
      )}
    </div>
  );
}

