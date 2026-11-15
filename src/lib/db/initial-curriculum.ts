// SARVONAYA initial curriculum creation for the course wizard.
// Creates the first module and lesson (optionally with an uploaded Mux video attached) in Supabase,
// mirrored into the in-memory store the curriculum UI reads from.
import { mockDb } from '@/lib/db/mock-db';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import type { LessonVideoPatch } from '@/lib/mux/lesson-video';
import type { CourseSection, Lesson } from '@/types/database';

interface InitialCurriculumInput {
  courseId: string;
  sectionTitle?: string;
  lessonTitle?: string;
  video?: LessonVideoPatch;
}

export async function createInitialCurriculum(
  input: InitialCurriculumInput
): Promise<{ section: CourseSection; lesson: Lesson } | null> {
  const lessonTitle = input.lessonTitle?.trim();
  if (!lessonTitle) return null;

  const now = new Date().toISOString();
  const video = input.video;
  const slug = lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'lesson-1';
  const durationMinutes = video?.duration_minutes ?? 15;

  const section: CourseSection = {
    id: `sec-${Date.now()}`,
    course_id: input.courseId,
    title: input.sectionTitle?.trim() || 'Module 1',
    description: '',
    sort_order: 1,
    is_published: true,
    created_at: now,
    updated_at: now,
  };

  const lesson: Lesson = {
    id: `les-${Date.now()}`,
    section_id: section.id,
    title: lessonTitle,
    slug,
    lesson_type: 'video',
    sort_order: 1,
    duration_minutes: durationMinutes,
    is_preview: false,
    is_published: true,
    ...video,
    created_at: now,
    updated_at: now,
  };

  try {
    const client = getSupabaseServerClient();

    const { data: sectionRow, error: sectionError } = await client
      .from('course_sections')
      .insert({
        course_id: input.courseId,
        title: section.title,
        description: section.description,
        sort_order: section.sort_order,
        is_published: true,
      })
      .select('id')
      .single();

    if (sectionError || !sectionRow) {
      console.warn('Supabase initial section insert failed:', sectionError?.message);
    } else {
      section.id = sectionRow.id;
      lesson.section_id = sectionRow.id;

      const { data: lessonRow, error: lessonError } = await client
        .from('lessons')
        .insert({
          section_id: sectionRow.id,
          title: lesson.title,
          slug: lesson.slug,
          lesson_type: lesson.lesson_type,
          sort_order: lesson.sort_order,
          duration_minutes: lesson.duration_minutes,
          is_preview: lesson.is_preview,
          is_published: true,
          ...(video ?? {}),
        })
        .select('id')
        .single();

      if (lessonError || !lessonRow) {
        console.warn('Supabase initial lesson insert failed:', lessonError?.message);
      } else {
        lesson.id = lessonRow.id;
      }
    }
  } catch (err) {
    console.warn('Supabase initial curriculum insert threw:', err);
  }

  mockDb.sections.push(section);
  mockDb.lessons.push(lesson);

  const mockCourse = mockDb.courses.find((c) => c.id === input.courseId);
  if (mockCourse) {
    mockCourse.sections_count = (mockCourse.sections_count ?? 0) + 1;
    mockCourse.lessons_count = (mockCourse.lessons_count ?? 0) + 1;
  }

  return { section, lesson };
}
