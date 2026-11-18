export const dynamic = 'force-dynamic';
// SARVONAYA Student Management API
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
    const branch = searchParams.get('branch') || '';
    const status = searchParams.get('status') || '';
    const format = searchParams.get('format');

    let students = await supabaseDb.students.list();

    if (search) {
      students = students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          (s.phone && s.phone.includes(search))
      );
    }

    if (status) {
      students = students.filter((s) => s.status === status);
    }

    const enriched = students.map((s) => {
      const qual = (s as any).academic_qualification || (s as any).academic_qualifications?.[0];
      const branchCode = qual?.branch?.code || qual?.branch?.branch_code || 'General';
      const college = qual?.college_name || 'Academic Institution';
      const degree = qual?.degree || 'B.Tech / B.E.';
      const passedOutYear = qual?.passed_out_year || new Date(s.created_at).getFullYear();

      return {
        id: s.id,
        fullName: s.full_name,
        email: s.email,
        phone: s.phone || 'N/A',
        status: s.status,
        branch: branchCode,
        college,
        degree,
        passedOutYear,
        enrolledCoursesCount: (s as any).enrolled_courses_count || 0,
        subscriptionStatus: (s as any).subscription_status || 'active',
        totalPaid: (s as any).total_spent || 0,
        registeredAt: s.created_at,
      };
    });

    if (branch) {
      const filtered = enriched.filter((e) => e.branch === branch);
      return NextResponse.json({ success: true, total: filtered.length, data: filtered });
    }

    // Handle CSV Export
    if (format === 'csv') {
      const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Status', 'Branch', 'College', 'Enrolled Courses', 'Total Paid (INR)', 'Registered At'];
      const rows = enriched.map((st) => [
        st.id,
        `"${st.fullName}"`,
        st.email,
        st.phone,
        st.status,
        st.branch,
        `"${st.college}"`,
        st.enrolledCoursesCount,
        st.totalPaid,
        st.registeredAt,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sarvonaya_students.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      total: enriched.length,
      data: enriched,
    });
  } catch (error) {
    console.error('Students API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
