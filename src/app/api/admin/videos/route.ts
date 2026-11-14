export const dynamic = 'force-dynamic';
// SARVONAYA Mux Video Assets API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Map lessons that have video assets
    const videoAssets = mockDb.lessons.map((l) => {
      const section = mockDb.sections.find((s) => s.id === l.section_id);
      const course = mockDb.courses.find((c) => c.id === section?.course_id);
      return {
        id: l.id,
        title: l.title,
        lessonId: l.id,
        courseTitle: course?.title || 'Engineering Course',
        muxAssetId: l.mux_asset_id || `mux-asset-${l.id}`,
        playbackId: l.mux_playback_id || `playback-${l.id}`,
        status: l.video_status || 'ready',
        durationSeconds: l.video_duration || l.duration_minutes * 60,
        resolution: l.video_resolution || '1080p',
        isSignedPolicy: true,
        createdAt: l.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: videoAssets,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch video assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, playbackId, assetId, durationSeconds, resolution } = await request.json();

    const lesson = mockDb.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    lesson.mux_playback_id = playbackId;
    lesson.mux_asset_id = assetId;
    lesson.video_duration = durationSeconds;
    lesson.video_resolution = resolution || '1080p';
    lesson.video_status = 'ready';
    lesson.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Video linked to lesson successfully',
      data: lesson,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to link video' }, { status: 500 });
  }
}

