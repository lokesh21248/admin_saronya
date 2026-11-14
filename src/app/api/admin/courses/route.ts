export const dynamic = 'force-dynamic';
// SARVONAYA Courses API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

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

    let courses = [...mockDb.courses];

    if (search) {
      courses = courses.filter((c) => c.title.toLowerCase().includes(search));
    }
    if (status) {
      courses = courses.filter((c) => c.status === status);
    }
    if (categoryId) {
      courses = courses.filter((c) => c.category_id === categoryId);
    }

    // Enrich courses with category name & instructor
    const enriched = courses.map((c) => {
      const cat = mockDb.categories.find((cat) => cat.id === c.category_id);
      const instructor = mockDb.profiles.find((p) => p.id === c.primary_instructor_id);
      return {
        ...c,
        categoryName: cat?.name || 'General Engineering',
        instructorName: instructor?.full_name || 'Prof. Faculty',
      };
    });

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
    const {
      title,
      slug,
      short_description,
      full_description,
      thumbnail_url,
      category_id,
      primary_instructor_id,
      difficulty_level,
      duration_hours,
      language,
      price,
      discount_price,
      is_subscription_eligible,
      status,
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Course title is required' }, { status: 400 });
    }

    const generatedSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCourse = {
      id: `course-${Date.now()}`,
      title,
      slug: generatedSlug,
      short_description: short_description || '',
      full_description: full_description || '',
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      category_id: category_id || 'c1',
      primary_instructor_id: primary_instructor_id || 'u2',
      difficulty_level: difficulty_level || 'all_levels',
      duration_hours: Number(duration_hours) || 20,
      language: language || 'English',
      price: Number(price) || 2999,
      discount_price: discount_price ? Number(discount_price) : undefined,
      is_subscription_eligible: is_subscription_eligible !== undefined ? is_subscription_eligible : true,
      access_duration_days: 365,
      status: status || 'draft',
      created_by: adminUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sections_count: 0,
      lessons_count: 0,
      enrollments_count: 0,
    };

    mockDb.courses.unshift(newCourse);

    // Audit log
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'COURSE_CREATED',
      entity_type: 'course',
      entity_id: newCourse.id,
      details: { title: newCourse.title, status: newCourse.status },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (error) {
    console.error('Courses POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

