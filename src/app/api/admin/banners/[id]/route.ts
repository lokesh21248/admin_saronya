export const dynamic = 'force-dynamic';
// SARVONAYA Admin Banner by ID API (PATCH & DELETE)
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

    const updated = await supabaseDb.banners.update(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'BANNER_UPDATED',
      target_type: 'banner',
      target_id: id,
      target_name: updated.title,
      details: body,
    });

    return NextResponse.json({
      success: true,
      message: 'Banner updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Admin Banner PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await supabaseDb.banners.getById(id);

    const deleted = await supabaseDb.banners.delete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Banner not found or could not be deleted' }, { status: 404 });
    }

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'BANNER_DELETED',
      target_type: 'banner',
      target_id: id,
      target_name: existing?.title || id,
    });

    return NextResponse.json({
      success: true,
      message: 'Banner permanently deleted',
    });
  } catch (error) {
    console.error('Admin Banner DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
