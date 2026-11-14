// SARVONAYA Individual Course API (GET, PATCH, DELETE)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

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
    const course = mockDb.courses.find((c) => c.id === id);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const sections = mockDb.sections
      .filter((s) => s.course_id === id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((sec) => {
        const lessons = mockDb.lessons
          .filter((l) => l.section_id === sec.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        return { ...sec, lessons };
      });

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        sections,
      },
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
    const course = mockDb.courses.find((c) => c.id === id);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    Object.assign(course, body, { updated_at: new Date().toISOString() });

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'COURSE_METADATA_UPDATED',
      entity_type: 'course',
      entity_id: course.id,
      details: { title: course.title },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Course PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

