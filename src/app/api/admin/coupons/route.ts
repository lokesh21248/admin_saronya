export const dynamic = 'force-dynamic';
// SARVONAYA Coupons & Discounts API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await supabaseDb.coupons.list();

    return NextResponse.json({
      success: true,
      data: coupons,
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

    const body = await request.json();
    const { code, description, discount_type, discount_value, min_order_amount, max_uses } = body;

    if (!code || !discount_value) {
      return NextResponse.json({ success: false, error: 'Coupon code and discount value required' }, { status: 400 });
    }

    const newCoupon = await supabaseDb.coupons.create({
      code,
      description,
      discount_type,
      discount_value: Number(discount_value),
      min_order_value: Number(min_order_amount) || 0,
      max_uses: Number(max_uses) || 500,
    });

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'COUPON_CREATED',
      target_type: 'coupon',
      target_id: newCoupon.id,
      target_name: newCoupon.code,
      details: { code: newCoupon.code, discount_value: newCoupon.discount_value },
    });

    return NextResponse.json({
      success: true,
      data: newCoupon,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create coupon' }, { status: 500 });
  }
}
