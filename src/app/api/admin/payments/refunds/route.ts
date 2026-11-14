export const dynamic = 'force-dynamic';
// SARVONAYA Refund Processing API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';
import { processRazorpayRefund } from '@/lib/razorpay/client';

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId, reason } = await request.json();

    if (!paymentId || !reason) {
      return NextResponse.json({ success: false, error: 'Payment ID and reason are required' }, { status: 400 });
    }

    const payment = mockDb.payments.find((p) => p.id === paymentId || p.razorpay_payment_id === paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Call Razorpay refund gateway
    const refundResult = await processRazorpayRefund(payment.razorpay_payment_id || payment.id, payment.amount, reason);

    payment.status = 'refunded';

    // Record audit trail
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'PAYMENT_REFUNDED',
      entity_type: 'payment',
      entity_id: payment.id,
      details: { amount: payment.amount, reason, refundId: refundResult.id },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Refund initiated and recorded successfully',
      data: refundResult,
    });
  } catch (error) {
    console.error('Refund Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

