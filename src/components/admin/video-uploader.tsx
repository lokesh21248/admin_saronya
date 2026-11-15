'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Film, Upload, CheckCircle2, Loader2, Play, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoUploaderProps {
  playbackId?: string;
  assetId?: string;
  lessonId?: string;
  onVideoSelected: (data: { playbackId: string; assetId?: string; durationSeconds?: number }) => void;
  label?: string;
}

export function VideoUploader({
  playbackId,
  assetId,
  lessonId,
  onVideoSelected,
  label = 'Lesson / Course Video Asset',
}: VideoUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'select'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Existing assets list
  const [existingAssets, setExistingAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Selected state
  const [selectedPlaybackId, setSelectedPlaybackId] = useState(playbackId || '');
  const [selectedAssetId, setSelectedAssetId] = useState(assetId || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (playbackId) setSelectedPlaybackId(playbackId);
    if (assetId) setSelectedAssetId(assetId);
  }, [playbackId, assetId]);

  // Load existing assets from account
  async function loadExistingAssets() {
    try {
      setLoadingAssets(true);
      const res = await fetch('/api/admin/videos');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setExistingAssets(json.data.filter((v: any) => v.playbackId));
      }
    } catch (err) {
      console.error('Failed to load Mux videos:', err);
    } finally {
      setLoadingAssets(false);
    }
  }

  function handleSelectMode(newMode: 'upload' | 'select') {
    setMode(newMode);
    if (newMode === 'select' && existingAssets.length === 0) {
      loadExistingAssets();
    }
  }

  async function handleDirectMuxUpload(chosenFile: File) {
    if (!chosenFile) return;

    try {
      setUploading(true);
      setError(null);
      setProgress(5);
      setStatusMessage('Requesting secure direct upload URL from Mux...');

      // 1. Get Direct Upload URL from backend
      const initRes = await fetch('/api/admin/videos/direct-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || 'Failed to initialize Mux upload');
      }

      const { uploadUrl, uploadId } = initData.data;

      // 2. Upload file directly to Mux with XMLHttpRequest
      setStatusMessage(`Uploading ${chosenFile.name} to Mux...`);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Mux rejected upload with HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error uploading video directly to Mux'));
        xhr.send(chosenFile);
      });

      // 3. Poll Mux for processing status
      setStatusMessage('Video received by Mux. Processing video stream...');
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/admin/videos/direct-upload?uploadId=${uploadId}&lessonId=${lessonId || ''}`);
          const pollData = await pollRes.json();

          if (pollData.success && (pollData.status === 'ready' || pollData.playbackId)) {
            clearInterval(pollInterval);
            setUploading(false);
            setStatusMessage(null);
            const pId = pollData.playbackId || uploadId;
            const aId = pollData.assetId || uploadId;
            setSelectedPlaybackId(pId);
            setSelectedAssetId(aId);
            onVideoSelected({
              playbackId: pId,
              assetId: aId,
              durationSeconds: pollData.video?.video_duration,
            });
          } else if (pollData.status === 'errored') {
            clearInterval(pollInterval);
            setUploading(false);
            setError(pollData.message || 'Mux encoding failed for this file');
          } else if (attempts > 30) {
            // After 60 seconds, accept and allow continuing
            clearInterval(pollInterval);
            setUploading(false);
            setSelectedPlaybackId(uploadId);
            onVideoSelected({ playbackId: uploadId, assetId: uploadId });
          }
        } catch {
          if (attempts > 30) {
            clearInterval(pollInterval);
            setUploading(false);
          }
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      setStatusMessage(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Film className="h-4 w-4 text-[#0B3473]" />
            {label}
          </label>
          <p className="text-[11px] text-slate-500">Mux HD Streaming with dynamic signed tokens</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => handleSelectMode('upload')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              mode === 'upload' ? 'bg-white text-[#0B3473] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct File Upload
          </button>
          <button
            type="button"
            onClick={() => handleSelectMode('select')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              mode === 'select' ? 'bg-white text-[#0B3473] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Select Existing Mux Asset
          </button>
        </div>
      </div>

      {/* Selected video banner */}
      {selectedPlaybackId && !uploading && (
        <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-900 truncate">Video Linked & Ready</p>
              <p className="text-[11px] font-mono text-emerald-700 truncate">
                Playback ID: {selectedPlaybackId}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPlaybackId('');
              setSelectedAssetId('');
              onVideoSelected({ playbackId: '' });
            }}
            className="text-xs h-7 text-emerald-800 hover:bg-emerald-100"
          >
            Change
          </Button>
        </div>
      )}

      {/* MODE 1: Direct File Upload to Mux */}
      {mode === 'upload' && !selectedPlaybackId && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.mkv,.webm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const chosen = e.target.files[0];
                setFile(chosen);
                handleDirectMuxUpload(chosen);
              }
            }}
          />

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#0B3473] hover:bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all"
          >
            {uploading ? (
              <div className="py-2 space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0B3473]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{statusMessage || `Uploading video to Mux... ${progress}%`}</span>
                </div>
                <div className="w-full max-w-sm mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0B3473] h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full bg-[#0B3473]/10 text-[#0B3473] flex items-center justify-center">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-[#0B3473] underline">Click to choose a video file</span> or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    MP4, MOV, MKV, WebM up to 5GB (direct high-speed Mux upload)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Select Existing Mux Asset */}
      {mode === 'select' && !selectedPlaybackId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Available Mux Assets in your account:</span>
            <button
              type="button"
              onClick={loadExistingAssets}
              className="text-[11px] text-[#0B3473] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          {loadingAssets ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#0B3473]" />
              Fetching Mux video library...
            </div>
          ) : existingAssets.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
              {existingAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedPlaybackId(asset.playbackId);
                    setSelectedAssetId(asset.muxAssetId || asset.id);
                    onVideoSelected({
                      playbackId: asset.playbackId,
                      assetId: asset.muxAssetId || asset.id,
                      durationSeconds: asset.durationSeconds,
                    });
                  }}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-[#0B3473] hover:bg-[#0B3473]/5 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="h-8 w-8 rounded-md bg-[#0B3473] text-[#F5BD24] flex items-center justify-center shrink-0">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {asset.title || asset.courseTitle || 'Mux Asset'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        ID: {asset.playbackId}
                      </p>
                    </div>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="text-xs h-7 shrink-0">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">
              No existing Mux assets found. Use direct file upload above.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
