export const dynamic = 'force-dynamic';
// SARVONAYA Individual Lesson Update API (PATCH & DELETE)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';
import { getSupabaseServerClient } from '@/lib/supabase/admin';

export async function PATCH(
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

    const client = getSupabaseServerClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.duration_minutes !== undefined) updatePayload.duration_minutes = Number(body.duration_minutes);
    if (body.is_preview !== undefined) updatePayload.is_preview = Boolean(body.is_preview);
    if (body.mux_playback_id !== undefined) updatePayload.mux_playback_id = body.mux_playback_id;
    if (body.mux_asset_id !== undefined) updatePayload.mux_asset_id = body.mux_asset_id;
    if (body.resource_url !== undefined) updatePayload.resource_url = body.resource_url;

    const { data: updated } = await client
      .from('lessons')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    const lesson = mockDb.lessons.find((l) => l.id === id);
    if (lesson) {
      Object.assign(lesson, body, { updated_at: new Date().toISOString() });
    }

    return NextResponse.json({ success: true, data: updated || lesson || { id, ...body } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const client = getSupabaseServerClient();
    await client.from('lessons').delete().eq('id', id);

    const idx = mockDb.lessons.findIndex((l) => l.id === id);
    if (idx !== -1) {
      mockDb.lessons.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
      data: { id },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete lesson' }, { status: 500 });
  }
}
