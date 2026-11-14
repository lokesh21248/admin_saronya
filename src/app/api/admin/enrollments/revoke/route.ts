export const dynamic = 'force-dynamic';
// SARVONAYA Revoke Enrollment Access API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

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

    const enrollment = mockDb.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) {
      return NextResponse.json({ success: false, error: 'Enrollment record not found' }, { status: 404 });
    }

    enrollment.status = 'revoked';
    enrollment.revoked_at = new Date().toISOString();
    enrollment.revoke_reason = reason;

    // Record audit event
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'COURSE_ACCESS_REVOKED',
      entity_type: 'enrollment',
      entity_id: enrollmentId,
      details: { enrollmentId, studentId: enrollment.student_id, courseId: enrollment.course_id, reason },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
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

