export const dynamic = 'force-dynamic';
// SARVONAYA Refund Processing API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import { supabaseDb } from '@/lib/supabase/db';
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

    const client = getSupabaseServerClient();
    const { data: dbPayment } = await client
      .from('payments')
      .select('*')
      .or(`id.eq.${paymentId},razorpay_payment_id.eq.${paymentId}`)
      .maybeSingle();

    const payment = dbPayment || mockDb.payments.find((p) => p.id === paymentId || p.razorpay_payment_id === paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    // Call Razorpay refund gateway
    const rzpId = payment.razorpay_payment_id || payment.id;
    const refundResult = await processRazorpayRefund(rzpId, Number(payment.amount), reason);

    if (dbPayment) {
      await client
        .from('payments')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', dbPayment.id);
    }
    payment.status = 'refunded';

    // Record audit trail
    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'PAYMENT_REFUNDED',
      target_type: 'payment',
      target_id: payment.id,
      details: { amount: payment.amount, reason, refundId: refundResult?.id },
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

