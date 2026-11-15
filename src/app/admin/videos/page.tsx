'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/status-badge';
import { VideoPreviewDialog, type PreviewTarget } from '@/components/admin/video-preview-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Video, Upload, ShieldCheck, Play, AlertTriangle, Loader2 } from 'lucide-react';

interface VideoRow {
  id: string;
  title: string;
  lessonId: string | null;
  courseTitle: string;
  muxAssetId: string | null;
  playbackId: string | null;
  status: string;
  durationSeconds: number;
  resolution: string;
  isSignedPolicy: boolean;
}

interface LessonOption {
  id: string;
  title: string;
  courseTitle: string;
  hasVideo: boolean;
}

interface UploadJob {
  uploadId: string;
  lessonId: string;
  lessonTitle: string;
  phase: 'processing' | 'ready' | 'errored';
  message?: string;
  startedAt: number;
}

const POLL_INTERVAL_MS = 4000;
const GIVE_UP_AFTER_MS = 30 * 60 * 1000;

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return '—';
  return `${Math.floor(totalSeconds / 60)}m ${Math.floor(totalSeconds % 60)}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/** PUTs the file to the Mux direct upload URL, reporting real byte progress. */
function putFile(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Mux rejected the upload (HTTP ${xhr.status})`));
    xhr.onerror = () => reject(new Error('Network error while uploading to Mux'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    signal.addEventListener('abort', () => xhr.abort());
    xhr.send(file);
  });
}

export default function MuxVideosManagementPage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [muxConfigured, setMuxConfigured] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const jobsRef = useRef<UploadJob[]>([]);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);

  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/videos')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setVideos(json.data);
          setLessons(json.lessons ?? []);
          setMuxConfigured(json.muxConfigured !== false);
          setLoadError(json.warning ?? null);
        } else {
          setLoadError(json.error || 'Failed to load videos');
        }
      })
      .catch((err) => {
        console.error('Error fetching videos:', err);
        if (!cancelled) setLoadError('Failed to load videos');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Abort an in-flight upload if the page unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  // Poll Mux (via our API, which also links the asset to the lesson) until processing finishes.
  const hasProcessingJobs = jobs.some((job) => job.phase === 'processing');
  useEffect(() => {
    if (!hasProcessingJobs) return;
    let cancelled = false;

    const tick = async () => {
      const active = jobsRef.current.filter((job) => job.phase === 'processing');

      const updates = await Promise.all(
        active.map(async (job): Promise<Pick<UploadJob, 'uploadId' | 'phase' | 'message'>> => {
          if (Date.now() - job.startedAt > GIVE_UP_AFTER_MS) {
            return {
              uploadId: job.uploadId,
              phase: 'errored',
              message: 'Still processing after 30 minutes. Refresh later to check the status.',
            };
          }
          try {
            const res = await fetch(
              `/api/admin/videos/direct-upload?uploadId=${encodeURIComponent(job.uploadId)}&lessonId=${encodeURIComponent(job.lessonId)}`
            );
            const json = await res.json();
            if (!json.success) return { uploadId: job.uploadId, phase: 'processing' };
            if (json.status === 'ready') return { uploadId: job.uploadId, phase: 'ready' };
            if (json.status === 'errored') {
              return { uploadId: job.uploadId, phase: 'errored', message: json.message };
            }
          } catch {
            // Transient network error; try again on the next tick.
          }
          return { uploadId: job.uploadId, phase: 'processing' };
        })
      );

      if (cancelled) return;

      setJobs((prev) =>
        prev.map((job) => {
          const update = updates.find((u) => u.uploadId === job.uploadId);
          return update ? { ...job, ...update } : job;
        })
      );
      if (updates.some((u) => u.phase !== 'processing')) reload();
    };

    const timer = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [hasProcessingJobs, reload]);

  function resetUploadForm() {
    setFile(null);
    setSelectedLessonId('');
    setUploadProgress(0);
    setUploadError(null);
    setDragging(false);
  }

  function handleModalOpenChange(open: boolean) {
    if (!open) {
      abortRef.current?.abort();
      resetUploadForm();
    }
    setUploadModalOpen(open);
  }

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!candidate.type.startsWith('video/')) {
      setUploadError('Please choose a video file (MP4, MOV, WebM...).');
      return;
    }
    setUploadError(null);
    setFile(candidate);
  }

  async function handleUpload() {
    if (!file || !selectedLessonId) return;

    const lesson = lessons.find((l) => l.id === selectedLessonId);
    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // 1. Ask our API for a Mux direct upload URL bound to this lesson.
      const res = await fetch('/api/admin/videos/direct-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ lessonId: selectedLessonId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Could not start upload (HTTP ${res.status})`);
      }

      // 2. Send the actual bytes straight to Mux.
      await putFile(json.data.uploadUrl, file, setUploadProgress, controller.signal);

      // 3. Mux now transcodes; the polling effect tracks it and refreshes the table when done.
      setJobs((prev) => [
        ...prev,
        {
          uploadId: json.data.uploadId,
          lessonId: selectedLessonId,
          lessonTitle: lesson?.title ?? 'Selected lesson',
          phase: 'processing',
          startedAt: Date.now(),
        },
      ]);
      setUploadModalOpen(false);
      resetUploadForm();
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('Direct upload failed:', err);
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      }
    } finally {
      setUploading(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Mux Video Infrastructure Library
          </h1>
          <p className="text-sm text-slate-500">
            High-performance direct uploads, HLS multi-bitrate processing, and signed playback tokens.
          </p>
        </div>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Upload className="h-4 w-4" />
          <span>Direct Upload Video Asset</span>
        </Button>
      </div>

      {/* Security Architecture Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-[#0B3473] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#0B3473]">
            Signed Playback Policy & Dynamic Watermarking
          </p>
          <p className="text-slate-600">
            All course videos use Mux Signed URLs. Playback IDs are never exposed as public MP4s. Access tokens are generated on-demand only after validating the student&apos;s active enrollment or subscription entitlement.
          </p>
        </div>
      </div>

      {!muxConfigured && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Mux API credentials are not configured (<span className="font-mono">MUX_TOKEN_ID</span> /{' '}
            <span className="font-mono">MUX_TOKEN_SECRET</span>). Uploads are disabled.
          </p>
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{loadError}</p>
        </div>
      )}

      {/* Upload processing status */}
      {jobs.length > 0 && (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.uploadId}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                {job.phase === 'processing' && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#0B3473]" />
                )}
                <span className="truncate font-medium text-slate-800">{job.lessonTitle}</span>
                <span className="text-slate-500">
                  {job.phase === 'processing' && 'Uploaded. Mux is processing the video...'}
                  {job.phase === 'ready' && 'Ready to stream.'}
                  {job.phase === 'errored' && (job.message || 'Processing failed.')}
                </span>
              </div>
              {job.phase !== 'processing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setJobs((prev) => prev.filter((j) => j.uploadId !== job.uploadId))}
                >
                  Dismiss
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video Assets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Video Title & Lesson</th>
                  <th className="px-6 py-3.5">Course Mapping</th>
                  <th className="px-4 py-3.5">Resolution</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Mux Status</th>
                  <th className="px-4 py-3.5">Playback Policy</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading video catalog...
                    </td>
                  </tr>
                ) : videos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No video assets yet. Upload one and attach it to a lesson.
                    </td>
                  </tr>
                ) : (
                  videos.map((vid) => (
                    <tr key={vid.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-blue-50 text-[#0B3473] shrink-0">
                            <Video className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{vid.title}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              Asset: {vid.muxAssetId ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {vid.courseTitle}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {vid.resolution}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {formatDuration(vid.durationSeconds)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={vid.status} />
                      </td>
                      <td className="px-4 py-4">
                        {vid.isSignedPolicy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Signed JWT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Public
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-[#0B3473]"
                          disabled={!vid.playbackId || vid.status !== 'ready'}
                          onClick={() =>
                            setPreviewTarget({
                              title: vid.title,
                              lessonId: vid.lessonId,
                              playbackId: vid.playbackId,
                            })
                          }
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Preview
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

      <VideoPreviewDialog target={previewTarget} onClose={() => setPreviewTarget(null)} />

      {/* Direct Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(event) => uploading && event.preventDefault()}
          onEscapeKeyDown={(event) => uploading && event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Upload Course Video to Mux</DialogTitle>
            <DialogDescription>
              Choose the lesson this video belongs to, then select the file to upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="upload-lesson" className="text-xs font-semibold text-slate-700">
                Lesson
              </label>
              <select
                id="upload-lesson"
                value={selectedLessonId}
                onChange={(event) => setSelectedLessonId(event.target.value)}
                disabled={uploading}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B3473]/20 focus-visible:border-[#0B3473] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a lesson...</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.courseTitle} — {lesson.title}
                    {lesson.hasVideo ? ' (replaces current video)' : ''}
                  </option>
                ))}
              </select>
              {lessons.length === 0 && !loading && (
                <p className="text-[11px] text-slate-500">
                  No video lessons exist yet. Create one in a course curriculum first.
                </p>
              )}
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && !uploading) {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!uploading) acceptFile(event.dataTransfer.files?.[0]);
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragging ? 'border-[#0B3473] bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  acceptFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              <Upload className="h-10 w-10 text-[#0B3473] mx-auto mb-2" />
              {file ? (
                <>
                  <p className="text-xs font-bold text-slate-800 break-all">{file.name}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{formatFileSize(file.size)} · click to choose a different file</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-800">
                    Drag and drop a video file here, or click to browse
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">MP4, MOV and WebM are supported</p>
                </>
              )}
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Uploading to Mux...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-[#0B3473] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && <p className="text-xs font-medium text-red-600">{uploadError}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => handleModalOpenChange(false)}>
                {uploading ? 'Cancel Upload' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleUpload}
                disabled={uploading || !file || !selectedLessonId || !muxConfigured}
              >
                {uploading ? 'Uploading...' : 'Start Direct Upload'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
