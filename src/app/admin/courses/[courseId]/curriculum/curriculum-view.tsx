'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { VideoUploader } from '@/components/admin/video-uploader';
import { FileUpload } from '@/components/ui/file-upload';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import {
  ArrowLeft,
  Plus,
  PlayCircle,
  FolderPlus,
  Upload,
  Film,
  FileText,
  Trash2,
} from 'lucide-react';

export default function CurriculumView({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState('20');
  const [isPreview, setIsPreview] = useState(false);
  const [newLessonPlaybackId, setNewLessonPlaybackId] = useState('');
  const [newLessonAssetId, setNewLessonAssetId] = useState('');
  const [newLessonResourceUrl, setNewLessonResourceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Course
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);

  // Video Linking Modal for existing lesson
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedLessonForVideo, setSelectedLessonForVideo] = useState<any>(null);
  const [tempPlaybackId, setTempPlaybackId] = useState('');
  const [tempAssetId, setTempAssetId] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  async function handleDeleteCourse() {
    try {
      setDeletingCourse(true);
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin/courses');
      } else {
        alert(data.error || 'Failed to delete course');
      }
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert('Error occurred while deleting course');
    } finally {
      setDeletingCourse(false);
    }
  }

  function openVideoModal(lesson: any) {
    setSelectedLessonForVideo(lesson);
    setTempPlaybackId(lesson.mux_playback_id || '');
    setTempAssetId(lesson.mux_asset_id || '');
    setVideoModalOpen(true);
  }

  async function handleSaveVideoToLesson() {
    if (!selectedLessonForVideo) return;
    try {
      setSavingVideo(true);
      const res = await fetch(`/api/admin/lessons/${selectedLessonForVideo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mux_playback_id: tempPlaybackId,
          mux_asset_id: tempAssetId,
        }),
      });
      if (res.ok) {
        setVideoModalOpen(false);
        setSelectedLessonForVideo(null);
        loadCourse();
      }
    } catch (err) {
      console.error('Failed to link video to lesson:', err);
    } finally {
      setSavingVideo(false);
    }
  }

  async function loadCourse() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}`);
      const json = await res.json();
      if (json.success) {
        setCourse(json.data);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/courses/${courseId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sectionTitle }),
      });
      if (res.ok) {
        setAddSectionOpen(false);
        setSectionTitle('');
        loadCourse();
      }
    } catch (err) {
      console.error('Error adding section:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonTitle.trim() || !targetSectionId) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/sections/${targetSectionId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          duration_minutes: Number(lessonDuration),
          is_preview: isPreview,
          lesson_type: 'video',
          mux_playback_id: newLessonPlaybackId || undefined,
          mux_asset_id: newLessonAssetId || undefined,
          resource_url: newLessonResourceUrl || undefined,
        }),
      });
      if (res.ok) {
        setAddLessonOpen(false);
        setLessonTitle('');
        setIsPreview(false);
        setNewLessonPlaybackId('');
        setNewLessonAssetId('');
        setNewLessonResourceUrl('');
        loadCourse();
      }
    } catch (err) {
      console.error('Error adding lesson:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading curriculum modules...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Curriculum Architecture
            </h1>
            <p className="text-xs text-slate-500">
              Course: <span className="font-semibold text-slate-800">{course?.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteCourseOpen(true)}
            className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Course</span>
          </Button>

          <Button
            onClick={() => setAddSectionOpen(true)}
            className="gap-1.5 bg-[#0B3473] hover:bg-[#082654]"
            size="sm"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Add Module Section</span>
          </Button>
        </div>
      </div>

      {/* Sections and Lessons Accordion View */}
      <div className="space-y-4">
        {(!course?.sections || course.sections.length === 0) ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-600 font-semibold">No curriculum sections created yet.</p>
            <Button
              onClick={() => setAddSectionOpen(true)}
              className="mt-4 gap-2 bg-[#0B3473]"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Module</span>
            </Button>
          </div>
        ) : (
          course.sections.map((section: any, sIdx: number) => (
            <Card key={section.id} className="overflow-hidden border border-slate-200">
              <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200 flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {section.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {section.lessons?.length || 0} Lessons • Module {sIdx + 1}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTargetSectionId(section.id);
                    setAddLessonOpen(true);
                  }}
                  className="h-8 text-xs gap-1 border-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Lesson</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {(!section.lessons || section.lessons.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No lessons in this module. Click "Add Lesson" to create one.
                    </div>
                  ) : (
                    section.lessons.map((lesson: any) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 text-[#0B3473]">
                            <PlayCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">{lesson.title}</p>
                              {lesson.is_preview && (
                                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              <span>Duration: {lesson.duration_minutes} mins</span>
                              <span>•</span>
                              <span>Mux: {lesson.mux_playback_id || 'Not Linked'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openVideoModal(lesson)}
                            className="h-7 text-xs text-[#0B3473] hover:bg-[#0B3473]/10"
                          >
                            <Film className="h-3.5 w-3.5 mr-1" />
                            {lesson.mux_playback_id ? 'Change Video' : 'Upload Video'}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Section Modal */}
      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Curriculum Module Section</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSection} className="space-y-4 pt-2">
            <div>
              <Label>Module Title</Label>
              <Input
                placeholder="e.g. Module 4: Production Deployment & Dockerization"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddSectionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Modal */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Lesson to Section</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4 pt-2">
            <div>
              <Label>Lesson Title</Label>
              <Input
                placeholder="e.g. 4.1 Building Multi-Stage Dockerfiles for Next.js"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration (Minutes)</Label>
                <Input
                  type="number"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between pt-5">
                <Label>Allow Free Preview?</Label>
                <Switch checked={isPreview} onCheckedChange={setIsPreview} />
              </div>
            </div>

            {/* Direct Video Upload for this Lesson */}
            <div className="pt-2">
              <VideoUploader
                label="Lesson Video Stream (Direct Upload to Mux)"
                playbackId={newLessonPlaybackId}
                assetId={newLessonAssetId}
                onVideoSelected={({ playbackId, assetId, durationSeconds }) => {
                  setNewLessonPlaybackId(playbackId);
                  if (assetId) setNewLessonAssetId(assetId);
                  if (durationSeconds) setLessonDuration(String(Math.ceil(durationSeconds / 60)));
                }}
              />
            </div>

            {/* Optional Resource Attachment */}
            <div className="pt-2">
              <FileUpload
                accept=".pdf,.doc,.docx,.zip"
                folder="curriculum-resources"
                label="Downloadable Resource (Cheat Sheet / Notes PDF)"
                description="Optional lecture notes or starter code archive"
                value={newLessonResourceUrl}
                onChange={setNewLessonResourceUrl}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddLessonOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Lesson'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link / Upload Video to Existing Lesson Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-[#0B3473]" />
              <span>Upload or Link Mux Video</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600">
              Target Lesson: <strong className="text-slate-900">{selectedLessonForVideo?.title}</strong>
            </p>
            <VideoUploader
              label="Lesson Video Stream"
              playbackId={tempPlaybackId}
              assetId={tempAssetId}
              lessonId={selectedLessonForVideo?.id}
              onVideoSelected={({ playbackId, assetId }) => {
                setTempPlaybackId(playbackId);
                if (assetId) setTempAssetId(assetId);
              }}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setVideoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#0B3473] hover:bg-[#082654]"
                onClick={handleSaveVideoToLesson}
                disabled={savingVideo || !tempPlaybackId}
              >
                {savingVideo ? 'Saving...' : 'Save Video to Lesson'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Course */}
      {deleteCourseOpen && (
        <ConfirmDialog
          open={deleteCourseOpen}
          onOpenChange={setDeleteCourseOpen}
          title="Delete Entire Engineering Course"
          description={`Are you sure you want to permanently delete "${course?.title || 'this course'}"? All curriculum modules, lessons, downloadable resources, and student access will be permanently destroyed. This action cannot be reversed.`}
          confirmLabel={deletingCourse ? 'Deleting Course...' : 'Delete Permanently'}
          isDestructive={true}
          onConfirm={handleDeleteCourse}
        />
      )}
    </div>
  );
}

