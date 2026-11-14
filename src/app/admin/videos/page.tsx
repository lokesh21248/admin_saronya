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
  Video,
  Upload,
  ShieldCheck,
  Play,
  Clock,
  Sparkles,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

export default function MuxVideosManagementPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function loadVideos() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/videos');
      const json = await res.json();
      if (json.success) {
        setVideos(json.data);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  async function handleSimulateUpload() {
    try {
      setUploading(true);
      setUploadProgress(15);

      // Call backend direct upload endpoint to get Mux direct upload URL
      const res = await fetch('/api/admin/videos/direct-upload', { method: 'POST' });
      const json = await res.json();

      setUploadProgress(45);
      await new Promise((r) => setTimeout(r, 600));
      setUploadProgress(80);
      await new Promise((r) => setTimeout(r, 500));
      setUploadProgress(100);

      // Close modal and refresh list
      setTimeout(() => {
        setUploading(false);
        setUploadModalOpen(false);
        setUploadProgress(0);
        loadVideos();
      }, 500);
    } catch (err) {
      console.error('Direct upload failed:', err);
      setUploading(false);
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
            All course videos use Mux Signed URLs. Playback IDs are never exposed as public MP4s. Access tokens are generated on-demand only after validating the student's active enrollment or subscription entitlement.
          </p>
        </div>
      </div>

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
                              Asset: {vid.muxAssetId}
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
                        {Math.floor(vid.durationSeconds / 60)}m {Math.floor(vid.durationSeconds % 60)}s
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={vid.status} />
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Signed JWT
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-[#0B3473]">
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

      {/* Direct Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Course Video to Mux</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors">
              <Upload className="h-10 w-10 text-[#0B3473] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Drag and drop MP4 / MOV video file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports 4K, 1080p, and high-framerate engineering screencasts up to 10GB
              </p>
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Uploading to Mux Direct URL...</span>
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleSimulateUpload}
                disabled={uploading}
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

