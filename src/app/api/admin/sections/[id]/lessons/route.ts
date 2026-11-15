// SARVONAYA Lessons Creation API (POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      lesson_type,
      duration_minutes,
      is_preview,
      mux_playback_id,
      mux_asset_id,
      resource_url,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Lesson title is required' }, { status: 400 });
    }

    const existingCount = mockDb.lessons.filter((l) => l.section_id === id).length;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newLesson = {
      id: `les-${Date.now()}`,
      section_id: id,
      title: title.trim(),
      slug,
      lesson_type: lesson_type || 'video',
      sort_order: existingCount + 1,
      duration_minutes: Number(duration_minutes) || 15,
      is_preview: Boolean(is_preview),
      is_published: true,
      mux_playback_id: mux_playback_id || undefined,
      mux_asset_id: mux_asset_id || undefined,
      resource_url: resource_url || undefined,
      video_status: 'ready' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.lessons.push(newLesson);

    return NextResponse.json({ success: true, data: newLesson });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create lesson' }, { status: 500 });
  }
}

