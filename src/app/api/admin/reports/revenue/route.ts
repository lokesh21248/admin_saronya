export const dynamic = 'force-dynamic';
// SARVONAYA Revenue Report API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';

export async function GET(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    const monthlyBreakdown = [
      { month: 'Jun 2026', coursesRevenue: 280000, subscriptionsRevenue: 190000, total: 470000 },
      { month: 'Jul 2026', coursesRevenue: 340000, subscriptionsRevenue: 220000, total: 560000 },
      { month: 'Aug 2026', coursesRevenue: 410000, subscriptionsRevenue: 310000, total: 720000 },
      { month: 'Sep 2026', coursesRevenue: 520000, subscriptionsRevenue: 390000, total: 910000 },
      { month: 'Oct 2026', coursesRevenue: 610000, subscriptionsRevenue: 480000, total: 1090000 },
      { month: 'Nov 2026', coursesRevenue: 680000, subscriptionsRevenue: 520000, total: 1200000 },
    ];

    if (format === 'csv') {
      const csv = [
        'Month,Courses Revenue (INR),Subscriptions Revenue (INR),Total Revenue (INR)',
        ...monthlyBreakdown.map((m) => `"${m.month}",${m.coursesRevenue},${m.subscriptionsRevenue},${m.total}`),
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sarvonaya_revenue_report.csv"',
        },
      });
    }

    return NextResponse.json({ success: true, data: monthlyBreakdown });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}

