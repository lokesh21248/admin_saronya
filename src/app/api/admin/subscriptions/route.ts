export const dynamic = 'force-dynamic';
// SARVONAYA Subscriptions API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = mockDb.subscriptions.map((sub) => {
      const student = mockDb.profiles.find((p) => p.id === sub.student_id);
      const plan = mockDb.subscriptionPlans.find((p) => p.id === sub.plan_id);
      return {
        ...sub,
        studentName: student?.full_name || 'Subscriber',
        studentEmail: student?.email || 'N/A',
        planName: plan?.name || 'Pass',
        price: plan?.discount_price || plan?.price || 0,
      };
    });

    return NextResponse.json({
      success: true,
      plans: mockDb.subscriptionPlans,
      subscriptions,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

