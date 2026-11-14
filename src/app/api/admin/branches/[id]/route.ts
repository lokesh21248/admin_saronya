// SARVONAYA Academic Branch Edit & Toggle Status (PATCH)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

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
    const branch = mockDb.branches.find((b) => b.id === id);

    if (!branch) {
      return NextResponse.json({ success: false, error: 'Branch not found' }, { status: 404 });
    }

    if (body.name !== undefined) branch.name = body.name.trim();
    if (body.description !== undefined) branch.description = body.description.trim();
    if (body.is_active !== undefined) {
      branch.is_active = Boolean(body.is_active);

      // Audit log for state changes
      mockDb.auditLogs.unshift({
        id: `log-${Date.now()}`,
        actor_id: adminUser.id,
        actor_email: adminUser.email,
        action: branch.is_active ? 'BRANCH_ACTIVATED' : 'BRANCH_DEACTIVATED',
        entity_type: 'academic_branch',
        entity_id: branch.id,
        details: { code: branch.code, is_active: branch.is_active },
        created_at: new Date().toISOString(),
      });
    }

    branch.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: 'Branch updated successfully',
      data: branch,
    });
  } catch (error) {
    console.error('Branch PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

