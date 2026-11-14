// SARVONAYA Course Publish / Status Workflow API
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
    const targetStatus = body.status || 'published';

    const course = mockDb.courses.find((c) => c.id === id);
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // Validation checks before publishing
    if (targetStatus === 'published') {
      if (!course.title || !course.price) {
        return NextResponse.json(
          { success: false, error: 'Course must possess a title and valid price before publishing' },
          { status: 422 }
        );
      }
      course.published_at = new Date().toISOString();
    }

    course.status = targetStatus;
    course.updated_at = new Date().toISOString();

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: `COURSE_${targetStatus.toUpperCase()}`,
      entity_type: 'course',
      entity_id: course.id,
      details: { title: course.title, newStatus: targetStatus },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Course successfully moved to ${targetStatus}`,
      data: course,
    });
  } catch (error) {
    console.error('Course Publish Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

