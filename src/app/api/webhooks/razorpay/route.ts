export const dynamic = 'force-dynamic';
// SARVONAYA Razorpay Webhook Handler
import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay/client';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import { mockDb } from '@/lib/db/mock-db';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Razorpay webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // convert paise to rupees

      try {
        const client = getSupabaseServerClient();

        // 1. Check if order exists
        const { data: order } = await client
          .from('orders')
          .select('id, student_id, course_id')
          .eq('razorpay_order_id', orderId)
          .maybeSingle();

        // 2. Insert or update payment record
        await client.from('payments').upsert({
          order_id: order?.id || null,
          student_id: order?.student_id || null,
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          amount,
          currency: paymentEntity.currency || 'INR',
          status: 'captured',
          method: paymentEntity.method,
          payment_email: paymentEntity.email,
        }, { onConflict: 'razorpay_payment_id' });

        // 3. Mark order as paid
        if (orderId) {
          await client
            .from('orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('razorpay_order_id', orderId);
        }

        // 4. Activate student enrollment if course order
        if (order?.student_id && order?.course_id) {
          await client.from('enrollments').upsert({
            student_id: order.student_id,
            course_id: order.course_id,
            access_type: 'individual_purchase',
            status: 'active',
            enrolled_at: new Date().toISOString(),
          }, { onConflict: 'student_id,course_id' });
        }
      } catch (dbErr) {
        console.warn('Supabase webhook sync warning:', dbErr);
      }

      // Keep mockDb in sync for backwards compatibility
      const existing = mockDb.payments.find((p) => p.razorpay_payment_id === paymentId);
      if (!existing) {
        mockDb.payments.unshift({
          id: `pay-${Date.now()}`,
          order_id: orderId,
          student_id: 's1',
          razorpay_payment_id: paymentId,
          amount,
          currency: paymentEntity.currency || 'INR',
          status: 'captured',
          method: paymentEntity.method,
          payment_email: paymentEntity.email,
          payment_contact: paymentEntity.contact,
          captured_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          course_title: 'Razorpay Verified Course Purchase',
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

