export const dynamic = 'force-dynamic';
// SARVONAYA Instructor Management API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const instructors = mockDb.profiles.filter((p) => p.roles?.includes('instructor')).map((inst) => {
      const assigned = mockDb.courses.filter((c) => c.primary_instructor_id === inst.id);
      return {
        ...inst,
        assignedCoursesCount: assigned.length,
        assignedCourses: assigned.map((c) => ({ id: c.id, title: c.title })),
        rating: 4.9,
        reviewsCount: 142,
      };
    });

    return NextResponse.json({
      success: true,
      data: instructors,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch instructors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name, email, phone, bio } = await request.json();

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 });
    }

    const newInstructor = {
      id: `u-${Date.now()}`,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      bio: bio || '',
      status: 'active' as const,
      roles: ['instructor' as const],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.profiles.push(newInstructor);

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'INSTRUCTOR_INVITED',
      entity_type: 'instructor',
      entity_id: newInstructor.id,
      details: { email: newInstructor.email, name: newInstructor.full_name },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Instructor invited successfully',
      data: newInstructor,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create instructor' }, { status: 500 });
  }
}

