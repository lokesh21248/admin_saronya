export const dynamic = 'force-dynamic';
// SARVONAYA Grant Complimentary Enrollment API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

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

    const expiresAt = new Date(Date.now() + (durationDays || 365) * 86400000).toISOString();

    // Check if existing enrollment exists
    const existing = mockDb.enrollments.find(
      (e) => e.student_id === studentId && e.course_id === courseId
    );

    if (existing) {
      existing.status = 'active';
      existing.access_type = 'complimentary';
      existing.expires_at = expiresAt;
      existing.grant_reason = reason;
      existing.granted_by = adminUser.id;
    } else {
      mockDb.enrollments.unshift({
        id: `enr-${Date.now()}`,
        student_id: studentId,
        course_id: courseId,
        access_type: 'complimentary',
        status: 'active',
        enrolled_at: new Date().toISOString(),
        expires_at: expiresAt,
        granted_by: adminUser.id,
        grant_reason: reason,
        progress_percentage: 0,
      });
    }

    // Log in immutable audit log
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'COMPLIMENTARY_ACCESS_GRANTED',
      entity_type: 'enrollment',
      entity_id: `${studentId}:${courseId}`,
      details: { studentId, courseId, reason, durationDays: durationDays || 365 },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Complimentary course access granted successfully',
    });
  } catch (error) {
    console.error('Grant Access Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

