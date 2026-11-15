export const dynamic = 'force-dynamic';
// SARVONAYA Course Publish / Status Workflow API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

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
    const targetStatus = body.status || 'published';

    const course = await supabaseDb.courses.getById(id);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Validation checks before publishing
    if (targetStatus === 'published' && (!course.title || !course.price)) {
      return NextResponse.json(
        { success: false, error: 'Course must possess a title and valid price before publishing' },
        { status: 422 }
      );
    }

    const updated = await supabaseDb.courses.update(id, {
      status: targetStatus,
      published_at: targetStatus === 'published' ? new Date().toISOString() : undefined,
    });

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: `COURSE_${targetStatus.toUpperCase()}`,
      target_type: 'course',
      target_id: course.id,
      target_name: course.title,
      details: { title: course.title, newStatus: targetStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Course successfully moved to ${targetStatus}`,
      data: updated,
    });
  } catch (error) {
    console.error('Course Publish Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
