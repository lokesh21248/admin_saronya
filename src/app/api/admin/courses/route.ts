export const dynamic = 'force-dynamic';
// SARVONAYA Courses API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';
import { createInitialCurriculum } from '@/lib/db/initial-curriculum';
import { pickVideoPatch } from '@/lib/mux/lesson-video';

export async function GET(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const categoryId = searchParams.get('categoryId') || '';

    let courses = await supabaseDb.courses.list();

    if (search) {
      courses = courses.filter((c) => c.title.toLowerCase().includes(search));
    }
    if (status) {
      courses = courses.filter((c) => c.status === status);
    }
    if (categoryId) {
      courses = courses.filter((c) => c.category_id === categoryId);
    }

    const enriched = courses.map((c) => ({
      ...c,
      categoryName: c.category?.name || 'General Engineering',
      instructorName: c.primary_instructor?.full_name || 'Prof. Faculty',
    }));

    return NextResponse.json({
      success: true,
      total: enriched.length,
      data: enriched,
    });
  } catch (error) {
    console.error('Courses GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Course title is required' }, { status: 400 });
    }

    const newCourse = await supabaseDb.courses.create(body);

    // The wizard collects a first module + lesson (and optionally an uploaded Mux video for it).
    const curriculum = await createInitialCurriculum({
      courseId: newCourse.id,
      sectionTitle: body.initial_section_title,
      lessonTitle: body.initial_lesson_title,
      video: pickVideoPatch(body.video),
    });

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'COURSE_CREATED',
      target_type: 'course',
      target_id: newCourse.id,
      target_name: newCourse.title,
      details: { status: newCourse.status, lesson_id: curriculum?.lesson.id, has_video: Boolean(curriculum?.lesson.mux_asset_id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      data: newCourse,
      curriculum: curriculum && { sectionId: curriculum.section.id, lessonId: curriculum.lesson.id },
    });
  } catch (error: any) {
    console.error('Courses POST Error:', error);
    const msg = error?.message || 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
