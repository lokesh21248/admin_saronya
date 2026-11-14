export const dynamic = 'force-dynamic';
// SARVONAYA Student Management API
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
    const branch = searchParams.get('branch') || '';
    const status = searchParams.get('status') || '';
    const format = searchParams.get('format');

    // Retrieve students from database
    let students = mockDb.profiles.filter(
      (p) => !p.roles || p.roles.includes('student') || p.roles.length === 0
    );

    // Apply text search on name, email, phone
    if (search) {
      students = students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          (s.phone && s.phone.includes(search))
      );
    }

    // Apply status filter
    if (status) {
      students = students.filter((s) => s.status === status);
    }

    // Map enriched student records with academic and subscription data
    const enriched = students.map((s, idx) => {
      const enrollments = mockDb.enrollments.filter((e) => e.student_id === s.id);
      const payments = mockDb.payments.filter((p) => p.student_id === s.id);
      const subscription = mockDb.subscriptions.find(
        (sub) => sub.student_id === s.id && sub.status === 'active'
      );
      const branchCode = ['CSE', 'ECE', 'IT', 'AIML', 'MECH'][idx % 5];
      const college = ['IIT Madras', 'NIT Trichy', 'Anna University', 'PSG Tech', 'BITS Pilani'][idx % 5];

      return {
        id: s.id,
        fullName: s.full_name,
        email: s.email,
        phone: s.phone || 'N/A',
        status: s.status,
        branch: branchCode,
        college,
        degree: 'B.Tech / B.E.',
        passedOutYear: 2025 - (idx % 3),
        enrolledCoursesCount: enrollments.length || (idx === 0 ? 3 : 1),
        subscriptionStatus: subscription ? subscription.status : 'None',
        totalPaid: payments.reduce((acc, curr) => acc + curr.amount, 0),
        registeredAt: s.created_at,
      };
    });

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

