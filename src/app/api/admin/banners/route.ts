export const dynamic = 'force-dynamic';
// SARVONAYA Admin Promotional Banners API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await supabaseDb.banners.list(false);

    return NextResponse.json({
      success: true,
      total: banners.length,
      data: banners,
    });
  } catch (error) {
    console.error('Admin Banners GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, error: 'Banner title/headline is required' }, { status: 400 });
    }

    const newBanner = await supabaseDb.banners.create({
      title: body.title.trim(),
      badge_text: body.badge_text?.trim() || '',
      callout_text: body.callout_text?.trim() || '',
      description: body.description?.trim() || '',
      cta_text: body.cta_text?.trim() || 'Explore Now',
      cta_url: body.cta_url?.trim() || '/subscriptions',
      background_color: body.background_color || '#0B3473',
      text_color: body.text_color || '#FFFFFF',
      image_url: body.image_url || '',
      display_order: Number(body.display_order) || 1,
      is_active: body.is_active !== false,
    });

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'BANNER_CREATED',
      target_type: 'banner',
      target_id: newBanner.id,
      target_name: newBanner.title,
      details: {
        badge: newBanner.badge_text,
        cta_url: newBanner.cta_url,
        order: newBanner.display_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Promotional banner created successfully',
      data: newBanner,
    });
  } catch (error) {
    console.error('Admin Banners POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
