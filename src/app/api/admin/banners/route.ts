export const dynamic = 'force-dynamic';
// SARVONAYA Admin Hero Banner API (GET & POST)
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
      return NextResponse.json({ success: false, error: 'Banner heading/title is required' }, { status: 400 });
    }

    const newBanner = await supabaseDb.banners.create({
      title: body.title.trim(),
      subtitle: body.subtitle?.trim() || body.description?.trim() || '',
      image_url: body.image_url || '',
      mobile_image_url: body.mobile_image_url || '',
      button_text: body.button_text?.trim() || body.cta_text?.trim() || 'Explore Courses',
      button_link: body.button_link?.trim() || body.cta_url?.trim() || '/courses',
      display_order: Number(body.display_order) || 1,
      is_active: body.is_active !== false,
    });

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'HERO_BANNER_CREATED',
      target_type: 'banner',
      target_id: newBanner.id,
      target_name: newBanner.title,
      details: {
        title: newBanner.title,
        button_link: newBanner.button_link,
        order: newBanner.display_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Homepage hero banner created successfully',
      data: newBanner,
    });
  } catch (error) {
    console.error('Admin Banners POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
