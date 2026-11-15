export const dynamic = 'force-dynamic';
// SARVONAYA Enrollments Management API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

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

    let enrollments = await supabaseDb.enrollments.list();

    let enriched = enrollments.map((enr) => ({
      ...enr,
      studentName: enr.student?.full_name || 'Student',
      studentEmail: enr.student?.email || 'N/A',
      courseTitle: enr.course?.title || 'Engineering Course',
    }));

    if (search) {
      enriched = enriched.filter(
        (e) =>
          e.studentName.toLowerCase().includes(search) ||
          e.studentEmail.toLowerCase().includes(search) ||
          e.courseTitle.toLowerCase().includes(search)
      );
    }

    if (accessType) {
      enriched = enriched.filter((e) => e.access_type === accessType);
    }

    if (status) {
      enriched = enriched.filter((e) => e.status === status);
    }

    return NextResponse.json({
      success: true,
      total: enriched.length,
      data: enriched,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}
