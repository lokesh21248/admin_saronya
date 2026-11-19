export const dynamic = 'force-dynamic';
// SARVONAYA Assignments API
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
      .from('assignments')
      .select('*, course:courses(id, title)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const assignments = data.map((a: any) => ({
        ...a,
        courseTitle: a.course?.title || 'Course',
        pendingReviewsCount: 0,
      }));
      return NextResponse.json({ success: true, data: assignments });
    }

    const assignments = mockDb.assignments.map((a) => {
      const course = mockDb.courses.find((c) => c.id === a.course_id);
      return {
        ...a,
        courseTitle: course?.title || 'Course',
        pendingReviewsCount: 14,
      };
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { course_id, title, instructions, max_marks } = await request.json();

    if (!title || !course_id) {
      return NextResponse.json({ success: false, error: 'Title and course_id required' }, { status: 400 });
    }

    const client = getSupabaseServerClient();
    const { data: inserted, error: insertError } = await client
      .from('assignments')
      .insert({
        course_id,
        title: title.trim(),
        instructions: instructions || 'Submit your project work.',
        max_marks: Number(max_marks) || 100,
        due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        is_published: true,
      })
      .select('*, course:courses(id, title)')
      .single();

    const newAssignment = inserted
      ? {
          ...inserted,
          courseTitle: inserted.course?.title || 'Course',
          pendingReviewsCount: 0,
        }
      : {
          id: `asg-${Date.now()}`,
          course_id,
          title: title.trim(),
          instructions: instructions || '',
          max_marks: Number(max_marks) || 100,
          due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
          is_published: true,
          submissions_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    mockDb.assignments.push(newAssignment);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'ASSIGNMENT_CREATED',
      target_type: 'assignment',
      target_id: newAssignment.id,
      target_name: newAssignment.title,
      details: { course_id, title },
    });

    return NextResponse.json({ success: true, data: newAssignment });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create assignment' }, { status: 500 });
  }
}

