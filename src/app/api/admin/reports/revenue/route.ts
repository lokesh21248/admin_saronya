export const dynamic = 'force-dynamic';
// SARVONAYA Revenue Report API
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
    const format = searchParams.get('format');

    const payments = await supabaseDb.payments.list();
    const captured = payments.filter((p) => p.status === 'captured');

    let monthlyBreakdown: { month: string; coursesRevenue: number; subscriptionsRevenue: number; total: number }[] = [];

    if (captured.length > 0) {
      const grouped: Record<string, { coursesRevenue: number; subscriptionsRevenue: number; total: number }> = {};
      for (const p of captured) {
        const monthKey = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!grouped[monthKey]) {
          grouped[monthKey] = { coursesRevenue: 0, subscriptionsRevenue: 0, total: 0 };
        }
        const amt = Number(p.amount) || 0;
        const isSub = (p as any).order?.order_type === 'subscription';
        if (isSub) {
          grouped[monthKey].subscriptionsRevenue += amt;
        } else {
          grouped[monthKey].coursesRevenue += amt;
        }
        grouped[monthKey].total += amt;
      }
      monthlyBreakdown = Object.entries(grouped).map(([month, val]) => ({
        month,
        ...val,
      }));
    } else {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyBreakdown = [
        { month: currentMonth, coursesRevenue: 0, subscriptionsRevenue: 0, total: 0 },
      ];
    }

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

