export const dynamic = 'force-dynamic';
// SARVONAYA Enrollments Management API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const accessType = searchParams.get('accessType') || '';
    const status = searchParams.get('status') || '';

    let enrollments = mockDb.enrollments.map((enr) => {
      const student = mockDb.profiles.find((p) => p.id === enr.student_id);
      const course = mockDb.courses.find((c) => c.id === enr.course_id);
      return {
        ...enr,
        studentName: student?.full_name || 'Student',
        studentEmail: student?.email || 'N/A',
        courseTitle: course?.title || 'Course',
      };
    });

    if (search) {
      enrollments = enrollments.filter(
        (e) =>
          e.studentName.toLowerCase().includes(search) ||
          e.studentEmail.toLowerCase().includes(search) ||
          e.courseTitle.toLowerCase().includes(search)
      );
    }

    if (accessType) {
      enrollments = enrollments.filter((e) => e.access_type === accessType);
    }

    if (status) {
      enrollments = enrollments.filter((e) => e.status === status);
    }

    return NextResponse.json({
      success: true,
      total: enrollments.length,
      data: enrollments,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

