export const dynamic = 'force-dynamic';
// SARVONAYA Curriculum Section API (PATCH & DELETE)
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
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.sort_order !== undefined) updatePayload.sort_order = body.sort_order;

    const { data: updated } = await client
      .from('course_sections')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    const section = mockDb.sections.find((s) => s.id === id);
    if (section) {
      Object.assign(section, body, { updated_at: new Date().toISOString() });
    }

    return NextResponse.json({ success: true, data: updated || section || { id, ...body } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update section' }, { status: 500 });
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

    // 1. Delete in Supabase if exists
    try {
      const client = getSupabaseServerClient();
      await client.from('lessons').delete().eq('section_id', id);
      await client.from('course_sections').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase section delete warning:', err);
    }

    // 2. Delete from mockDb
    mockDb.lessons = mockDb.lessons.filter((l) => l.section_id !== id);
    const idx = mockDb.sections.findIndex((s) => s.id === id);
    if (idx !== -1) {
      mockDb.sections.splice(idx, 1);
    }

    return NextResponse.json({
      success: true,
      message: 'Curriculum section and lessons deleted successfully',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete section' }, { status: 500 });
  }
}
