'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, FileText, Film, Loader2, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  description?: string;
  folder?: string;
  bucket?: string;
  maxSizeMB?: number;
  allowUrlFallback?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept = 'image/*',
  label,
  description,
  folder = 'uploads',
  bucket,
  maxSizeMB = 25,
  allowUrlFallback = true,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = accept.includes('image');
  const isVideo = accept.includes('video');

  async function handleFileSelect(file: File) {
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMB}MB`);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setProgress(15);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      if (bucket) formData.append('bucket', bucket);

      // Simulated initial progress for immediate responsiveness
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 150);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
        {allowUrlFallback && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-[#0B3473] hover:underline flex items-center gap-1 font-medium"
          >
            <LinkIcon className="h-3 w-3" />
            {showUrlInput ? 'Switch to File Upload' : 'Paste Direct URL'}
          </button>
        )}
      </div>

      {showUrlInput ? (
        <div className="space-y-2">
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="text-xs"
          />
          {value && isImage && (
            <div className="relative h-32 w-full max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img src={value} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {/* Current file preview */}
          {value && !uploading ? (
            <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {isImage ? (
                  <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <img src={value} alt="Uploaded" className="h-full w-full object-cover" />
                  </div>
                ) : isVideo ? (
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-[#0B3473]/10 text-[#0B3473] flex items-center justify-center">
                    <Film className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-[#0B3473]/10 text-[#0B3473] flex items-center justify-center">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">File ready & saved</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs">{value}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-8"
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange('')}
                  className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Upload dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                dragging
                  ? 'border-[#0B3473] bg-[#0B3473]/5 scale-[1.01]'
                  : 'border-slate-300 hover:border-[#0B3473] hover:bg-slate-50/80 bg-white'
              }`}
            >
              {uploading ? (
                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#0B3473]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Uploading file... {progress}%</span>
                  </div>
                  <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#0B3473] h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-[#0B3473]">
                    {isImage ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : isVideo ? (
                      <Film className="h-5 w-5" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      <span className="text-[#0B3473] hover:underline font-bold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {description || (isImage ? 'PNG, JPG, WebP, SVG up to 25MB' : 'Max 50MB')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}
