export const dynamic = 'force-dynamic';
// SARVONAYA Academic Branch Edit & Toggle Status (PATCH)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await supabaseDb.branches.update(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    }

    if (body.is_active !== undefined) {
      await supabaseDb.auditLogs.log({
        actor_id: adminUser.id,
        actor_name: adminUser.name,
        action: updated.is_active ? 'BRANCH_ACTIVATED' : 'BRANCH_DEACTIVATED',
        target_type: 'academic_branch',
        target_id: updated.id,
        target_name: updated.name,
        details: { code: updated.code, is_active: updated.is_active },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Branch updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Branch PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
