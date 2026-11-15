// SARVONAYA lesson <-> Mux video persistence.
// Lessons live in the in-memory store (what the admin curriculum UI edits) and are mirrored to
// Supabase when the lesson id is a real UUID row. Both are updated so they never drift apart.
import { mockDb } from '@/lib/db/mock-db';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import type { Lesson, VideoStatus } from '@/types/database';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The `lessons` columns a Mux asset can change. */
export interface LessonVideoPatch {
  mux_asset_id?: string;
  mux_playback_id?: string;
  video_duration?: number;
  video_status?: VideoStatus;
  video_resolution?: string;
  duration_minutes?: number;
}

export interface LessonWithCourse {
  lesson: Lesson;
  courseId?: string;
}

export async function findLessonWithCourse(lessonId: string): Promise<LessonWithCourse | null> {
  const mockLesson = mockDb.lessons.find((l) => l.id === lessonId);
  if (mockLesson) {
    const section = mockDb.sections.find((s) => s.id === mockLesson.section_id);
    return { lesson: mockLesson, courseId: section?.course_id };
  }

  if (!UUID_RE.test(lessonId)) return null;

  try {
    const { data, error } = await getSupabaseServerClient()
      .from('lessons')
      .select('*, section:course_sections(course_id)')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase lesson lookup failed:', error.message);
      return null;
    }
    if (!data) return null;

    const { section, ...lesson } = data;
    return { lesson: lesson as Lesson, courseId: section?.course_id };
  } catch (err) {
    console.warn('Supabase lesson lookup threw:', err);
    return null;
  }
}

/**
 * Applies a video patch to the lesson identified by `lessonId`, falling back to the lesson that
 * already owns `assetId`. Returns whether any store matched a lesson.
 */
export async function applyLessonVideoUpdate(
  target: { lessonId?: string; assetId?: string },
  patch: LessonVideoPatch
): Promise<{ matched: boolean }> {
  const updatedAt = new Date().toISOString();
  let matched = false;

  const mockLesson =
    (target.lessonId ? mockDb.lessons.find((l) => l.id === target.lessonId) : undefined) ??
    (target.assetId ? mockDb.lessons.find((l) => l.mux_asset_id === target.assetId) : undefined);

  if (mockLesson) {
    Object.assign(mockLesson, patch, { updated_at: updatedAt });
    matched = true;
  }

  const filter: [string, string] | null =
    target.lessonId && UUID_RE.test(target.lessonId)
      ? ['id', target.lessonId]
      : target.assetId
        ? ['mux_asset_id', target.assetId]
        : null;

  if (filter) {
    try {
      const { data, error } = await getSupabaseServerClient()
        .from('lessons')
        .update({ ...patch, updated_at: updatedAt })
        .eq(filter[0], filter[1])
        .select('id');

      if (error) {
        console.warn('Supabase lesson video update failed:', error.message);
      } else if (data && data.length > 0) {
        matched = true;
      }
    } catch (err) {
      console.warn('Supabase lesson video update threw:', err);
    }
  }

  return { matched };
}

const VIDEO_STATUSES: VideoStatus[] = ['uploading', 'processing', 'ready', 'errored', 'archived'];

/**
 * Whitelists the video fields a browser may send (the course wizard carries them from upload to
 * save). Anything unknown or mistyped is dropped, so clients can't write arbitrary columns.
 */
export function pickVideoPatch(raw: unknown): LessonVideoPatch | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const input = raw as Record<string, unknown>;

  const text = (value: unknown) =>
    typeof value === 'string' && value.length > 0 && value.length <= 255 ? value : undefined;
  const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined);

  const patch: LessonVideoPatch = {};
  const assetId = text(input.mux_asset_id);
  if (!assetId) return undefined; // without an asset there is nothing to attach

  patch.mux_asset_id = assetId;
  const playbackId = text(input.mux_playback_id);
  if (playbackId) patch.mux_playback_id = playbackId;
  const duration = num(input.video_duration);
  if (duration !== undefined) patch.video_duration = duration;
  const minutes = num(input.duration_minutes);
  if (minutes !== undefined) patch.duration_minutes = Math.round(minutes);
  const resolution = text(input.video_resolution);
  if (resolution) patch.video_resolution = resolution;
  if (VIDEO_STATUSES.includes(input.video_status as VideoStatus)) {
    patch.video_status = input.video_status as VideoStatus;
  }

  return patch;
}

export interface LinkedLesson {
  id: string;
  title: string;
  courseTitle?: string;
  videoStatus?: VideoStatus;
}

/** Finds persisted (Supabase) lessons that already own the given Mux asset ids. */
export async function findLessonsByAssetIds(assetIds: string[]): Promise<Map<string, LinkedLesson>> {
  const found = new Map<string, LinkedLesson>();
  if (assetIds.length === 0) return found;

  try {
    const { data, error } = await getSupabaseServerClient()
      .from('lessons')
      .select('id, title, mux_asset_id, video_status, section:course_sections(course:courses(title))')
      .in('mux_asset_id', assetIds);

    if (error) {
      console.warn('Supabase lesson-by-asset lookup failed:', error.message);
      return found;
    }

    for (const row of data ?? []) {
      // PostgREST embeds can arrive as an object or a single-item array depending on inference.
      const section = Array.isArray(row.section) ? row.section[0] : row.section;
      const course = Array.isArray(section?.course) ? section.course[0] : section?.course;
      found.set(row.mux_asset_id, {
        id: row.id,
        title: row.title,
        courseTitle: course?.title,
        videoStatus: row.video_status ?? undefined,
      });
    }
  } catch (err) {
    console.warn('Supabase lesson-by-asset lookup threw:', err);
  }

  return found;
}
