export const dynamic = 'force-dynamic';
// SARVONAYA Subscriptions API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [plans, rawSubscriptions] = await Promise.all([
      supabaseDb.subscriptions.plans(),
      supabaseDb.subscriptions.list(),
    ]);

    const subscriptions = rawSubscriptions.map((sub: any) => ({
      ...sub,
      studentName: sub.student?.full_name || 'Subscriber',
      studentEmail: sub.student?.email || 'N/A',
      planName: sub.plan?.name || 'Pass',
      price: sub.plan?.discount_price || sub.plan?.price || 0,
    }));

    return NextResponse.json({
      success: true,
      plans,
      subscriptions,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

