export const dynamic = 'force-dynamic';
// SARVONAYA Revoke Enrollment Access API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { enrollmentId, reason } = await request.json();

    if (!enrollmentId || !reason) {
      return NextResponse.json(
        { success: false, error: 'enrollmentId and reason are required' },
        { status: 400 }
      );
    }

    await supabaseDb.enrollments.revoke(enrollmentId);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'COURSE_ACCESS_REVOKED',
      target_type: 'enrollment',
      target_id: enrollmentId,
      details: { enrollmentId, reason },
    });

    return NextResponse.json({
      success: true,
      message: 'Enrollment access revoked successfully',
    });
  } catch (error) {
    console.error('Revoke Access Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
