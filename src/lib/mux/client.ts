// SARVONAYA Mux Video Infrastructure Integration
// Handles direct upload creation, upload/asset lookups, signed playback tokens and webhook verification.
import crypto from 'crypto';
import type { LessonVideoPatch } from '@/lib/mux/lesson-video';

const MUX_API_BASE = 'https://api.mux.com/video/v1';

/** Error carrying the HTTP status a route handler should answer with. */
export class MuxError extends Error {
  /** Status our own route should answer with. */
  status: number;
  /** Status Mux itself answered with, when the failure came from the Mux API. */
  upstreamStatus?: number;

  constructor(message: string, status = 500, upstreamStatus?: number) {
    super(message);
    this.name = 'MuxError';
    this.status = status;
    this.upstreamStatus = upstreamStatus;
  }
}

export interface DirectUploadResponse {
  uploadUrl: string;
  uploadId: string;
}

export interface MuxPlaybackId {
  id: string;
  policy: 'public' | 'signed' | 'drm';
}

export interface MuxUpload {
  id: string;
  url?: string;
  status: 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out';
  asset_id?: string;
  error?: { type?: string; message?: string };
  new_asset_settings?: { passthrough?: string };
}

export interface MuxAsset {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  passthrough?: string;
  upload_id?: string;
  created_at?: string;
  playback_ids?: MuxPlaybackId[];
  resolution_tier?: string;
  max_resolution_tier?: string;
  max_stored_resolution?: string;
  errors?: { type?: string; messages?: string[] };
}

export function isMuxConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

export function isSignedPlaybackConfigured(): boolean {
  return Boolean(process.env.MUX_SIGNING_KEY_ID && process.env.MUX_SIGNING_PRIVATE_KEY);
}

async function muxRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new MuxError('Mux API credentials (MUX_TOKEN_ID / MUX_TOKEN_SECRET) are not configured.', 503);
  }

  const response = await fetch(`${MUX_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString('base64')}`,
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error?.messages?.join('; ') || body?.error?.type || '';
    } catch {
      // Non-JSON error body; the status code alone will do.
    }
    throw new MuxError(
      `Mux API responded ${response.status}${detail ? `: ${detail}` : ''}`,
      response.status === 404 ? 404 : 502,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const json = await response.json();
  return json.data as T;
}

/**
 * Permanently deletes a video asset from Mux.
 */
export async function deleteMuxAsset(assetId: string): Promise<boolean> {
  try {
    await muxRequest<void>(`/assets/${encodeURIComponent(assetId)}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    console.warn(`Failed to delete Mux asset ${assetId}:`, err);
    return false;
  }
}

/**
 * Creates a Mux direct upload. When a lesson id is given it is stored as the asset `passthrough`,
 * so every later asset webhook can be matched back to the lesson. Without one (e.g. the course
 * wizard, before any lesson exists) the asset is matched later by its own id.
 */
export async function createMuxDirectUpload(options: {
  lessonId?: string;
  corsOrigin?: string;
}): Promise<DirectUploadResponse> {
  const upload = await muxRequest<MuxUpload>('/uploads', {
    method: 'POST',
    body: JSON.stringify({
      cors_origin: options.corsOrigin || '*',
      new_asset_settings: {
        playback_policy: [isSignedPlaybackConfigured() ? 'signed' : 'public'],
        normalize_audio: true,
        ...(options.lessonId && { passthrough: options.lessonId }),
      },
    }),
  });

  if (!upload?.url || !upload.id) {
    throw new MuxError('Mux did not return an upload URL.', 502);
  }

  return { uploadUrl: upload.url, uploadId: upload.id };
}

export function getMuxUpload(uploadId: string): Promise<MuxUpload> {
  return muxRequest<MuxUpload>(`/uploads/${encodeURIComponent(uploadId)}`);
}

export function getMuxAsset(assetId: string): Promise<MuxAsset> {
  return muxRequest<MuxAsset>(`/assets/${encodeURIComponent(assetId)}`);
}

export function listMuxAssets(limit = 50): Promise<MuxAsset[]> {
  return muxRequest<MuxAsset[]>(`/assets?limit=${limit}`);
}

// A playback ID's policy never changes, so cache lookups for the life of the server process.
const playbackPolicyCache = new Map<string, MuxPlaybackId['policy']>();

/**
 * Looks up whether a playback ID is public or signed. This matters because Mux answers 400 to a
 * token presented on a public playback ID, and 403 to a missing token on a signed one.
 */
export async function getPlaybackPolicy(playbackId: string): Promise<MuxPlaybackId['policy']> {
  const cached = playbackPolicyCache.get(playbackId);
  if (cached) return cached;

  const info = await muxRequest<MuxPlaybackId>(`/playback-ids/${encodeURIComponent(playbackId)}`);

  if (playbackPolicyCache.size >= 1000) playbackPolicyCache.clear();
  playbackPolicyCache.set(playbackId, info.policy);
  return info.policy;
}

/** Translates a Mux asset into the lesson columns it should populate. */
export function assetToLessonVideoPatch(asset: MuxAsset): LessonVideoPatch {
  const patch: LessonVideoPatch = {
    mux_asset_id: asset.id,
    video_status: asset.status === 'ready' ? 'ready' : asset.status === 'errored' ? 'errored' : 'processing',
  };

  if (asset.status === 'ready') {
    const playbackId = asset.playback_ids?.[0]?.id;
    if (playbackId) patch.mux_playback_id = playbackId;

    if (typeof asset.duration === 'number') {
      patch.video_duration = Math.round(asset.duration * 100) / 100;
      patch.duration_minutes = Math.max(1, Math.round(asset.duration / 60));
    }

    const resolution = asset.resolution_tier ?? asset.max_resolution_tier ?? asset.max_stored_resolution;
    if (resolution) patch.video_resolution = resolution;
  }

  return patch;
}

function loadSigningKey(): crypto.KeyObject {
  let raw = (process.env.MUX_SIGNING_PRIVATE_KEY ?? '').trim();

  // Mux hands the key out base64-encoded; accept either that or a raw PEM.
  if (!raw.includes('-----BEGIN')) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }

  // Restore escaped newlines for single-line env vars.
  return crypto.createPrivateKey(raw.replace(/\\n/g, '\n'));
}

/**
 * Issues a real RS256 Mux playback JWT. Throws instead of returning a placeholder:
 * a fake token only turns a clear configuration error into a confusing 403 from Mux.
 */
export function generateSignedPlaybackToken(playbackId: string, durationSeconds = 86400): string {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  if (!keyId || !process.env.MUX_SIGNING_PRIVATE_KEY) {
    throw new MuxError('Mux signing key (MUX_SIGNING_KEY_ID / MUX_SIGNING_PRIVATE_KEY) is not configured.', 503);
  }

  let key: crypto.KeyObject;
  try {
    key = loadSigningKey();
  } catch {
    throw new MuxError('MUX_SIGNING_PRIVATE_KEY could not be parsed as a private key.', 500);
  }

  const header = { alg: 'RS256', typ: 'JWT', kid: keyId };
  const payload = {
    sub: playbackId,
    aud: 'v',
    exp: Math.floor(Date.now() / 1000) + durationSeconds,
  };

  const unsigned = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(
    JSON.stringify(payload)
  ).toString('base64url')}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), key).toString('base64url');

  return `${unsigned}.${signature}`;
}

export function buildStreamUrl(playbackId: string, token?: string): string {
  const base = `https://stream.mux.com/${playbackId}.m3u8`;
  return token ? `${base}?token=${token}` : base;
}

/**
 * Verifies a `Mux-Signature` header (`t=<unix>,v1=<hex hmac>`) against the raw request body.
 * Uses a constant-time comparison and rejects timestamps outside the tolerance window.
 */
export function verifyMuxWebhookSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300
): boolean {
  if (!header) return false;

  const parts = header.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > toleranceSeconds) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest();

  return signatures.some((signature) => {
    const candidate = Buffer.from(signature, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  });
}
