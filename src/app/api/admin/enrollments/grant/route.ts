export const dynamic = 'force-dynamic';
// SARVONAYA Grant Complimentary Enrollment API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, courseId, reason, durationDays } = await request.json();

    if (!studentId || !courseId || !reason) {
      return NextResponse.json(
        { success: false, error: 'studentId, courseId and reason are required' },
        { status: 400 }
      );
    }

    const enrollment = await supabaseDb.enrollments.grant(studentId, courseId, reason);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'COMPLIMENTARY_ACCESS_GRANTED',
      target_type: 'enrollment',
      target_id: enrollment.id,
      target_name: `${studentId}:${courseId}`,
      details: { studentId, courseId, reason, durationDays: durationDays || 365 },
    });

    return NextResponse.json({
      success: true,
      message: 'Complimentary course access granted successfully',
      data: enrollment,
    });
  } catch (error) {
    console.error('Grant Access Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
