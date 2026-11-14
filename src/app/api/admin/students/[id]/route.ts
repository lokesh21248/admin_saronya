// SARVONAYA Individual Student API (GET & PATCH)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const student = mockDb.profiles.find((p) => p.id === id);

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const enrollments = mockDb.enrollments.filter((e) => e.student_id === id).map((e) => {
      const course = mockDb.courses.find((c) => c.id === e.course_id);
      return {
        ...e,
        courseTitle: course?.title || 'Engineering Course',
        thumbnailUrl: course?.thumbnail_url,
      };
    });

    const payments = mockDb.payments.filter((p) => p.student_id === id);
    const subscriptions = mockDb.subscriptions.filter((s) => s.student_id === id).map((s) => {
      const plan = mockDb.subscriptionPlans.find((p) => p.id === s.plan_id);
      return {
        ...s,
        planName: plan?.name || 'Subscription Plan',
      };
    });
    const certificates = mockDb.certificates.filter((c) => c.student_id === id);

    // Verified academic qualification details
    const academic = {
      collegeName: 'IIT Madras',
      degree: 'B.Tech - Computer Science',
      branchCode: 'CSE',
      passedOutYear: 2025,
      rollNumber: 'CS21B045',
      isVerified: true,
      verifiedBy: 'Dr. Rajesh Sharma',
      verifiedAt: '2026-09-12T10:00:00Z',
    };

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        academic,
        enrollments,
        payments,
        subscriptions,
        certificates,
        adminNotes: 'Student verified via institutional college ID. High performer in frontend and cloud curriculum.',
      },
    });
  } catch (error) {
    console.error('Student Details API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const student = mockDb.profiles.find((p) => p.id === id);

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Update status if requested
    if (body.status && ['active', 'suspended', 'inactive'].includes(body.status)) {
      student.status = body.status;
      student.updated_at = new Date().toISOString();

      // Record immutable audit log
      mockDb.auditLogs.unshift({
        id: `log-${Date.now()}`,
        actor_id: adminUser.id,
        actor_email: adminUser.email,
        action: `STUDENT_STATUS_${body.status.toUpperCase()}`,
        entity_type: 'student',
        entity_id: student.id,
        details: { studentName: student.full_name, previousStatus: student.status, newStatus: body.status, reason: body.reason || 'Admin action' },
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Student record updated successfully',
      student,
    });
  } catch (error) {
    console.error('Update Student Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

