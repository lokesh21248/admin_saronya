export const dynamic = 'force-dynamic';
// SARVONAYA Certificates Management API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const certificates = mockDb.certificates.map((c) => {
      const student = mockDb.profiles.find((p) => p.id === c.student_id);
      const course = mockDb.courses.find((cr) => cr.id === c.course_id);
      return {
        ...c,
        studentName: student?.full_name || 'Student',
        studentEmail: student?.email || 'N/A',
        courseTitle: course?.title || 'Course',
      };
    });

    return NextResponse.json({ success: true, data: certificates });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id, course_id } = await request.json();

    if (!student_id || !course_id) {
      return NextResponse.json({ success: false, error: 'student_id and course_id required' }, { status: 400 });
    }

    const code = `SARV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newCert = {
      id: `cert-${Date.now()}`,
      certificate_code: code,
      student_id,
      course_id,
      issue_date: new Date().toISOString(),
      pdf_url: `https://sarvonaya.edu/certificates/${code}.pdf`,
      is_revoked: false,
    };

    mockDb.certificates.unshift(newCert);

    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'CERTIFICATE_ISSUED',
      entity_type: 'certificate',
      entity_id: newCert.certificate_code,
      details: { student_id, course_id, code },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, data: newCert });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to issue certificate' }, { status: 500 });
  }
}

