export const dynamic = 'force-dynamic';
// SARVONAYA Individual Course API (GET, PATCH, DELETE)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const course = await supabaseDb.courses.getById(id);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Course GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const updated = await supabaseDb.courses.update(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'COURSE_METADATA_UPDATED',
      target_type: 'course',
      target_id: updated.id,
      target_name: updated.title,
      details: { title: updated.title },
    });

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Course PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
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
    const existing = await supabaseDb.courses.getById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    await supabaseDb.courses.delete(id);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'COURSE_DELETED',
      target_type: 'course',
      target_id: id,
      target_name: existing.title,
      details: { title: existing.title, slug: existing.slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Course permanently deleted successfully',
    });
  } catch (error) {
    console.error('Course DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
