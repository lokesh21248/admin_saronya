export const dynamic = 'force-dynamic';
// SARVONAYA Coupons & Discounts API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: mockDb.coupons,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { code, description, discount_type, discount_value, min_order_amount, max_uses } = await request.json();

    if (!code || !discount_value) {
      return NextResponse.json({ success: false, error: 'Coupon code and discount value required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    const newCoupon = {
      id: `coup-${Date.now()}`,
      code: upperCode,
      description: description || '',
      discount_type: discount_type || 'percentage',
      discount_value: Number(discount_value),
      min_order_amount: Number(min_order_amount) || 0,
      start_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 180 * 86400000).toISOString(),
      max_uses: Number(max_uses) || 500,
      used_count: 0,
      per_student_limit: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.coupons.unshift(newCoupon);

    return NextResponse.json({
      success: true,
      data: newCoupon,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create coupon' }, { status: 500 });
  }
}

