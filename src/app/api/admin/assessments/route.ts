export const dynamic = 'force-dynamic';
// SARVONAYA Assessments & Quizzes API
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
      .from('quizzes')
      .select('*, course:courses(id, title)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const quizzes = data.map((q: any) => ({
        ...q,
        courseTitle: q.course?.title || 'Course',
        attemptsCount: 0,
        passRatePct: 100,
      }));
      return NextResponse.json({ success: true, data: quizzes });
    }

    const quizzes = mockDb.quizzes.map((q) => {
      const course = mockDb.courses.find((c) => c.id === q.course_id);
      return {
        ...q,
        courseTitle: course?.title || 'Course',
        attemptsCount: 148,
        passRatePct: 76,
      };
    });

    return NextResponse.json({ success: true, data: quizzes });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { course_id, title, description, pass_percentage, time_limit_minutes } = await request.json();

    if (!title || !course_id) {
      return NextResponse.json({ success: false, error: 'Title and course_id required' }, { status: 400 });
    }

    const client = getSupabaseServerClient();
    const { data: inserted, error: insertError } = await client
      .from('quizzes')
      .insert({
        course_id,
        title: title.trim(),
        description: description || '',
        pass_percentage: Number(pass_percentage) || 70,
        time_limit_minutes: Number(time_limit_minutes) || 30,
        max_retakes: 3,
        is_published: true,
      })
      .select('*, course:courses(id, title)')
      .single();

    const newQuiz = inserted
      ? {
          ...inserted,
          courseTitle: inserted.course?.title || 'Course',
          attemptsCount: 0,
          passRatePct: 100,
        }
      : {
          id: `qz-${Date.now()}`,
          course_id,
          title: title.trim(),
          description: description || '',
          pass_percentage: Number(pass_percentage) || 70,
          time_limit_minutes: Number(time_limit_minutes) || 30,
          max_retakes: 3,
          is_published: true,
          questions_count: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    mockDb.quizzes.push(newQuiz);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'ASSESSMENT_CREATED',
      target_type: 'quiz',
      target_id: newQuiz.id,
      target_name: newQuiz.title,
      details: { course_id, title },
    });

    return NextResponse.json({ success: true, data: newQuiz });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create assessment' }, { status: 500 });
  }
}

