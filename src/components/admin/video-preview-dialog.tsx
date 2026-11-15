'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PreviewTarget {
  title: string;
  lessonId?: string | null;
  playbackId?: string | null;
}

interface TokenResult {
  target: PreviewTarget;
  streamUrl?: string;
  error?: string;
}

interface VideoPreviewDialogProps {
  target: PreviewTarget | null;
  onClose: () => void;
}

/** Requests a playback token for the target and plays the resulting Mux HLS stream. */
export function VideoPreviewDialog({ target, onClose }: VideoPreviewDialogProps) {
  const [result, setResult] = useState<TokenResult | null>(null);
  const [playerError, setPlayerError] = useState<{ streamUrl: string; message: string } | null>(null);

  useEffect(() => {
    if (!target) return;

    let cancelled = false;

    fetch('/api/videos/playback-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId: target.lessonId ?? undefined,
        playbackId: target.playbackId ?? undefined,
      }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || `Playback token request failed (${res.status})`);
        }
        return json.streamUrl as string;
      })
      .then((streamUrl) => {
        if (!cancelled) setResult({ target, streamUrl });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ target, error: err instanceof Error ? err.message : 'Could not load video' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [target]);

  // Ignore results that belong to a previously opened target.
  const current = target && result?.target === target ? result : null;
  const streamUrl = current?.streamUrl;
  const message =
    current?.error ?? (streamUrl && playerError?.streamUrl === streamUrl ? playerError.message : undefined);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{target?.title ?? 'Preview'}</DialogTitle>
          <DialogDescription>Streaming from Mux.</DialogDescription>
        </DialogHeader>

        <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-slate-900">
          {!current ? (
            <p className="text-sm text-slate-300">Requesting playback token...</p>
          ) : message ? (
            <p className="px-6 text-center text-sm text-red-200">{message}</p>
          ) : (
            <video
              key={streamUrl}
              src={streamUrl}
              controls
              autoPlay
              playsInline
              className="h-full w-full"
              onError={() =>
                streamUrl &&
                setPlayerError({
                  streamUrl,
                  message:
                    'This browser could not play the stream. It may not support HLS natively, or Mux could not serve this asset (demo data has no real video).',
                })
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
