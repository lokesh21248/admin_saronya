export const dynamic = 'force-dynamic';
// SARVONAYA Subscription Plans API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  return NextResponse.json({ success: true, data: mockDb.subscriptionPlans });
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, interval, duration_days, price, discount_price, description, features } = await request.json();

    if (!name || !price || !interval) {
      return NextResponse.json({ success: false, error: 'Name, interval and price are required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newPlan = {
      id: `plan-${Date.now()}`,
      name: name.trim(),
      slug,
      description: description || '',
      interval,
      duration_days: Number(duration_days) || 30,
      price: Number(price),
      discount_price: discount_price ? Number(discount_price) : undefined,
      razorpay_plan_id: `plan_rzp_${slug}`,
      is_active: true,
      features: features || ['Full access to all courses', 'HD streaming', 'Completion certificates'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_subscribers_count: 0,
    };

    mockDb.subscriptionPlans.push(newPlan);

    return NextResponse.json({ success: true, data: newPlan });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 });
  }
}

