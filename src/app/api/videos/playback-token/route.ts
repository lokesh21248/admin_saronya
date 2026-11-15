export const dynamic = 'force-dynamic';
// SARVONAYA Mux Video Authorization & Token Issuer
// Verifies admin role or student entitlement before issuing a signed Mux playback token.
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import {
  MuxError,
  buildStreamUrl,
  generateSignedPlaybackToken,
  getPlaybackPolicy,
  isSignedPlaybackConfigured,
} from '@/lib/mux/client';
import { findLessonWithCourse } from '@/lib/mux/lesson-video';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import { mockDb } from '@/lib/db/mock-db';

const TOKEN_TTL_SECONDS = 7200; // 2 hours

/** True when the student holds an active enrollment for this course or an active subscription. */
async function studentHasAccess(studentId: string, courseId: string): Promise<boolean> {
  try {
    const client = getSupabaseServerClient();

    const { data: enrollment } = await client
      .from('enrollments')
      .select('status')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (enrollment) return true;

    const { data: subscription } = await client
      .from('subscriptions')
      .select('status')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (subscription) return true;
  } catch (err) {
    console.warn('Supabase entitlement check failed, using in-memory fallback:', err);
  }

  return (
    mockDb.enrollments.some(
      (e) => e.student_id === studentId && e.course_id === courseId && e.status === 'active'
    ) || mockDb.subscriptions.some((s) => s.student_id === studentId && s.status === 'active')
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const lessonId: string | undefined = typeof body?.lessonId === 'string' ? body.lessonId : undefined;
    const requestedPlaybackId: string | undefined =
      typeof body?.playbackId === 'string' ? body.playbackId : undefined;
    const studentId: string | undefined = typeof body?.studentId === 'string' ? body.studentId : undefined;

    if (!requestedPlaybackId && !lessonId) {
      return NextResponse.json(
        { success: false, error: 'playbackId or lessonId is required' },
        { status: 400 }
      );
    }

    const found = lessonId ? await findLessonWithCourse(lessonId) : null;
    if (lessonId && !found) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    const adminUser = await getCurrentAdminUser();
    const isAdmin = Boolean(
      adminUser?.roles.some((r) => ['super_admin', 'admin', 'course_manager', 'instructor'].includes(r))
    );

    let isAuthorized = isAdmin;

    if (!isAuthorized && found) {
      if (found.lesson.is_preview) {
        isAuthorized = true;
      } else if (studentId && found.courseId) {
        isAuthorized = await studentHasAccess(studentId, found.courseId);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Active course enrollment or subscription required to stream this lesson.',
        },
        { status: 403 }
      );
    }

    // Only admins may sign an arbitrary playback ID. For everyone else the lesson decides which video
    // they get; otherwise a free-preview lesson id plus a paid video's playback ID would unlock it.
    const playbackId = isAdmin
      ? (requestedPlaybackId ?? found?.lesson.mux_playback_id)
      : found?.lesson.mux_playback_id;

    if (!playbackId) {
      return NextResponse.json(
        { success: false, error: 'Video asset or playback ID not found for this lesson' },
        { status: 404 }
      );
    }

    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();

    // Sign only playback IDs that actually have a signed policy: Mux rejects tokens on public IDs.
    let policy: string;
    try {
      policy = await getPlaybackPolicy(playbackId);
    } catch (err) {
      // Mux answers 404 for unknown IDs and 400 for malformed ones (e.g. seeded demo data).
      if (err instanceof MuxError && (err.upstreamStatus === 404 || err.upstreamStatus === 400)) {
        return NextResponse.json(
          { success: false, error: 'Playback ID not found in Mux. This lesson may point at demo data.' },
          { status: 404 }
        );
      }
      // Mux unreachable or unconfigured: assume new uploads' convention (signed iff a key exists).
      policy = isSignedPlaybackConfigured() ? 'signed' : 'public';
      console.warn(`Playback policy lookup failed for ${playbackId}; assuming '${policy}':`, err);
    }

    if (policy !== 'signed') {
      return NextResponse.json({
        success: true,
        playbackId,
        signed: false,
        token: null,
        streamUrl: buildStreamUrl(playbackId),
        expiresAt,
      });
    }

    const token = generateSignedPlaybackToken(playbackId, TOKEN_TTL_SECONDS);

    return NextResponse.json({
      success: true,
      playbackId,
      signed: true,
      token,
      streamUrl: buildStreamUrl(playbackId, token),
      expiresAt,
    });
  } catch (error) {
    console.error('Playback Token Error:', error);
    if (error instanceof MuxError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to issue playback token' }, { status: 500 });
  }
}
