export const dynamic = 'force-dynamic';
// SARVONAYA Platform Settings API (GET & PATCH)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await supabaseDb.settings.get();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { category, settings } = await request.json();

    if (category && settings) {
      await supabaseDb.settings.update(category, settings);

      await supabaseDb.auditLogs.log({
        actor_id: adminUser.id,
        actor_name: adminUser.name,
        action: 'PLATFORM_SETTINGS_UPDATED',
        target_type: 'platform_settings',
        target_id: category,
        details: { category },
      });
    }

    const updated = await supabaseDb.settings.get();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
