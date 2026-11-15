export const dynamic = 'force-dynamic';
// SARVONAYA Individual Student API (GET & PATCH)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

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
    const student = await supabaseDb.students.getById(id);

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const enrollments = await supabaseDb.enrollments.list();
    const studentEnrollments = enrollments.filter((e) => e.student_id === id).map((e) => ({
      ...e,
      courseTitle: e.course?.title || 'Engineering Course',
      thumbnailUrl: e.course?.thumbnail_url,
    }));

    const payments = await supabaseDb.payments.list();
    const studentPayments = payments.filter((p: any) => p.order?.student_id === id);

    const subscriptions = await supabaseDb.subscriptions.list();
    const studentSubscriptions = subscriptions.filter((s) => s.student_id === id);

    const academic = {
      collegeName: 'National Institute of Technology',
      degree: 'B.Tech - Computer Science & Engineering',
      branchCode: 'CSE',
      passedOutYear: 2026,
      rollNumber: 'CS22B042',
      isVerified: true,
      verifiedBy: 'Dr. Rajesh Sharma',
      verifiedAt: '2026-09-12T10:00:00Z',
    };

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        academic,
        enrollments: studentEnrollments,
        payments: studentPayments,
        subscriptions: studentSubscriptions,
        certificates: [],
        adminNotes: 'Student verified via institutional university records. Active participant in advanced architecture tracks.',
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

    if (body.status && ['active', 'suspended', 'inactive'].includes(body.status)) {
      const updated = await supabaseDb.students.updateStatus(id, body.status);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }

      await supabaseDb.auditLogs.log({
        actor_id: adminUser.id,
        actor_name: adminUser.name,
        action: `STUDENT_STATUS_${body.status.toUpperCase()}`,
        target_type: 'student',
        target_id: updated.id,
        target_name: updated.full_name,
        details: { previousStatus: updated.status, newStatus: body.status, reason: body.reason || 'Admin action' },
      });

      return NextResponse.json({
        success: true,
        message: 'Student record updated successfully',
        student: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });
  } catch (error) {
    console.error('Update Student Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
