export const dynamic = 'force-dynamic';
// SARVONAYA Certificates Management API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import { supabaseDb } from '@/lib/supabase/db';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from('certificates')
      .select('*, student:profiles!certificates_student_id_fkey(id, full_name, email), course:courses(id, title)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const certificates = data.map((c: any) => ({
        ...c,
        studentName: c.student?.full_name || 'Student',
        studentEmail: c.student?.email || 'N/A',
        courseTitle: c.course?.title || 'Course',
      }));
      return NextResponse.json({ success: true, data: certificates });
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

    const client = getSupabaseServerClient();
    const { data: inserted, error: insertError } = await client
      .from('certificates')
      .insert({
        certificate_code: code,
        student_id,
        course_id,
        issue_date: new Date().toISOString(),
        pdf_url: `https://sarvonaya.edu/certificates/${code}.pdf`,
        is_revoked: false,
      })
      .select('*, student:profiles!certificates_student_id_fkey(id, full_name, email), course:courses(id, title)')
      .single();

    const newCert = inserted
      ? {
          ...inserted,
          studentName: inserted.student?.full_name || 'Student',
          studentEmail: inserted.student?.email || 'N/A',
          courseTitle: inserted.course?.title || 'Course',
        }
      : {
          id: `cert-${Date.now()}`,
          certificate_code: code,
          student_id,
          course_id,
          issue_date: new Date().toISOString(),
          pdf_url: `https://sarvonaya.edu/certificates/${code}.pdf`,
          is_revoked: false,
        };

    mockDb.certificates.unshift(newCert);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'CERTIFICATE_ISSUED',
      target_type: 'certificate',
      target_id: newCert.certificate_code || newCert.id,
      details: { student_id, course_id, code },
    });

    return NextResponse.json({ success: true, data: newCert });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to issue certificate' }, { status: 500 });
  }
}

