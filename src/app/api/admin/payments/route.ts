export const dynamic = 'force-dynamic';
// SARVONAYA Payments & Ledger API
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
    const status = searchParams.get('status') || '';

    let payments = [...mockDb.payments];

    if (search) {
      payments = payments.filter(
        (p) =>
          p.razorpay_payment_id?.toLowerCase().includes(search) ||
          p.payment_email?.toLowerCase().includes(search) ||
          p.course_title?.toLowerCase().includes(search)
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

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue: 4852900,
        successfulCount: 1420,
        refundsTotal: totalRefunded,
        pendingCount: 0,
      },
      data: payments,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 });
  }
}

