export const dynamic = 'force-dynamic';
// SARVONAYA Payments & Ledger API
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
    const status = searchParams.get('status') || '';

    let payments = await supabaseDb.payments.list();

    if (search) {
      payments = payments.filter(
        (p: any) =>
          p.razorpay_payment_id?.toLowerCase().includes(search) ||
          p.order?.student?.email?.toLowerCase().includes(search) ||
          p.order?.student?.full_name?.toLowerCase().includes(search)
      );
    }

    if (status) {
      payments = payments.filter((p) => p.status === status);
    }

    const totalCaptured = payments
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0);

    const capturedCount = payments.filter((p) => p.status === 'captured').length;
    const pendingCount = payments.filter((p) => p.status === 'created' || p.status === 'authorized').length;

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue: totalCaptured,
        successfulCount: capturedCount,
        refundsTotal: totalRefunded,
        pendingCount,
      },
      data: payments,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}
