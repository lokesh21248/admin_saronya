export const dynamic = 'force-dynamic';
// SARVONAYA Assignments API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = mockDb.assignments.map((a) => {
      const course = mockDb.courses.find((c) => c.id === a.course_id);
      return {
        ...a,
        courseTitle: course?.title || 'Course',
        pendingReviewsCount: 14,
      };
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { course_id, title, instructions, max_marks } = await request.json();

    if (!title || !course_id) {
      return NextResponse.json({ success: false, error: 'Title and course_id required' }, { status: 400 });
    }

    const newAssignment = {
      id: `asg-${Date.now()}`,
      course_id,
      title: title.trim(),
      instructions: instructions || '',
      max_marks: Number(max_marks) || 100,
      due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      is_published: true,
      submissions_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.assignments.push(newAssignment);

    return NextResponse.json({ success: true, data: newAssignment });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create assignment' }, { status: 500 });
  }
}

