export const dynamic = 'force-dynamic';
// SARVONAYA Mux Video Assets API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';
import { isMuxConfigured, listMuxAssets, deleteMuxAsset } from '@/lib/mux/client';
import { applyLessonVideoUpdate, findLessonWithCourse } from '@/lib/mux/lesson-video';
import type { Lesson } from '@/types/database';

function courseTitleFor(lesson: Lesson | undefined): string {
  if (!lesson) return 'Not linked to a lesson';
  const section = mockDb.sections.find((s) => s.id === lesson.section_id);
  return mockDb.courses.find((c) => c.id === section?.course_id)?.title ?? 'Unassigned course';
}

function lessonOptions() {
  return mockDb.lessons
    .filter((l) => l.lesson_type === 'video')
    .map((l) => ({
      id: l.id,
      title: l.title,
      courseTitle: courseTitleFor(l),
      hasVideo: Boolean(l.mux_asset_id),
    }));
}

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const muxConfigured = isMuxConfigured();
    let warning: string | undefined;

    if (muxConfigured) {
      try {
        const assets = await listMuxAssets(50);
        const lessonById = new Map(mockDb.lessons.map((l) => [l.id, l]));
        const lessonByAsset = new Map(
          mockDb.lessons.filter((l) => l.mux_asset_id).map((l) => [l.mux_asset_id as string, l])
        );

        const data = assets.map((asset) => {
          // Prefer the lesson that currently owns this asset; otherwise the lesson it was uploaded for.
          const lesson = lessonByAsset.get(asset.id) ?? (asset.passthrough ? lessonById.get(asset.passthrough) : undefined);
          const superseded = Boolean(lesson?.mux_asset_id && lesson.mux_asset_id !== asset.id);
          const playback = asset.playback_ids?.[0];

          return {
            id: asset.id,
            title: lesson ? `${lesson.title}${superseded ? ' (replaced upload)' : ''}` : 'Unlinked Mux asset',
            lessonId: lesson?.id ?? null,
            courseTitle: courseTitleFor(lesson),
            muxAssetId: asset.id,
            playbackId: playback?.id ?? null,
            status: asset.status === 'preparing' ? 'processing' : asset.status,
            durationSeconds: asset.duration ? Math.round(asset.duration) : 0,
            resolution: asset.resolution_tier ?? asset.max_resolution_tier ?? asset.max_stored_resolution ?? '—',
            isSignedPolicy: playback?.policy === 'signed',
            createdAt: asset.created_at
              ? new Date(Number(asset.created_at) * 1000).toISOString()
              : new Date().toISOString(),
          };
        });

        return NextResponse.json({
          success: true,
          muxConfigured,
          total: data.length,
          data,
          lessons: lessonOptions(),
        });
      } catch (err) {
        console.warn('Mux asset listing failed, falling back to stored lesson videos:', err);
        warning = `Could not load assets from Mux (${err instanceof Error ? err.message : 'unknown error'}). Showing stored lesson data.`;
      }
    }

    // Fallback: whatever the lessons themselves record. No ids are invented for lessons without a video.
    const data = mockDb.lessons
      .filter((l) => l.lesson_type === 'video' && l.mux_asset_id)
      .map((l) => ({
        id: l.id,
        title: l.title,
        lessonId: l.id,
        courseTitle: courseTitleFor(l),
        muxAssetId: l.mux_asset_id ?? null,
        playbackId: l.mux_playback_id ?? null,
        status: l.video_status ?? 'ready',
        durationSeconds: l.video_duration ?? l.duration_minutes * 60,
        resolution: l.video_resolution ?? '—',
        isSignedPolicy: true,
        createdAt: l.created_at,
      }));

    return NextResponse.json({
      success: true,
      muxConfigured,
      warning,
      total: data.length,
      data,
      lessons: lessonOptions(),
    });
  } catch (error) {
    console.error('Failed to fetch video assets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch video assets' }, { status: 500 });
  }
}

// Manually link an existing Mux asset to a lesson.
export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, playbackId, assetId, durationSeconds, resolution } = await request.json();

    if (!(await findLessonWithCourse(lessonId))) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    await applyLessonVideoUpdate(
      { lessonId },
      {
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        video_duration: durationSeconds,
        video_resolution: resolution || '1080p',
        video_status: 'ready',
      }
    );

    const updated = await findLessonWithCourse(lessonId);

    return NextResponse.json({
      success: true,
      message: 'Video linked to lesson successfully',
      data: updated?.lesson,
    });
  } catch (error) {
    console.error('Failed to link video:', error);
    return NextResponse.json({ success: false, error: 'Failed to link video' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId, lessonId } = await request.json();

    if (lessonId) {
      await applyLessonVideoUpdate(
        { lessonId },
        {
          mux_asset_id: undefined,
          mux_playback_id: undefined,
          video_status: 'ready',
        }
      );
    } else if (assetId) {
      const linked = mockDb.lessons.find((l) => l.mux_asset_id === assetId);
      if (linked) {
        linked.mux_asset_id = undefined;
        linked.mux_playback_id = undefined;
      }
    }

    if (assetId && isMuxConfigured()) {
      await deleteMuxAsset(assetId);
    }

    return NextResponse.json({
      success: true,
      message: 'Video asset removed successfully',
    });
  } catch (error) {
    console.error('Failed to delete video asset:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete video asset' }, { status: 500 });
  }
}
