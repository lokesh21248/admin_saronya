export const dynamic = 'force-dynamic';
// SARVONAYA Lessons Creation API (POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';
import { getSupabaseServerClient } from '@/lib/supabase/admin';

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

    const client = getSupabaseServerClient();
    const { data: existing } = await client
      .from('lessons')
      .select('sort_order')
      .eq('section_id', id);

    const sortOrder = (existing?.length || 0) + 1;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `lesson-${Date.now()}`;

    const { data: inserted, error } = await client
      .from('lessons')
      .insert({
        section_id: id,
        title: title.trim(),
        slug,
        lesson_type: lesson_type || 'video',
        sort_order: sortOrder,
        duration_minutes: Number(duration_minutes) || 15,
        is_preview: Boolean(is_preview),
        is_published: true,
        mux_playback_id: mux_playback_id || null,
        mux_asset_id: mux_asset_id || null,
        resource_url: resource_url || null,
      })
      .select()
      .single();

    if (!error && inserted) {
      mockDb.lessons.push(inserted);
      return NextResponse.json({ success: true, data: inserted });
    }

    if (error) {
      console.error('Lesson creation database error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const fallbackLesson = {
      id: `les-${Date.now()}`,
      section_id: id,
      title: title.trim(),
      slug,
      lesson_type: lesson_type || 'video',
      sort_order: sortOrder,
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

    mockDb.lessons.push(fallbackLesson);
    return NextResponse.json({ success: true, data: fallbackLesson });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create lesson' }, { status: 500 });
  }
}
