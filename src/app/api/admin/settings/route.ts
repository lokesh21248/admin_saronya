export const dynamic = 'force-dynamic';
// SARVONAYA Platform Settings API (GET & PATCH)
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
      data: mockDb.platformSettings,
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

    if (category && mockDb.platformSettings[category as keyof typeof mockDb.platformSettings]) {
      Object.assign(
        mockDb.platformSettings[category as keyof typeof mockDb.platformSettings],
        settings
      );
    }

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entity_type: 'platform_settings',
      entity_id: category,
      details: { category },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: mockDb.platformSettings,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}

