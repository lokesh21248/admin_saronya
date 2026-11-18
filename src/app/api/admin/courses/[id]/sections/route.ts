export const dynamic = 'force-dynamic';
// SARVONAYA Course Sections API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';
import { getSupabaseServerClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseServerClient();
    const { data: dbSections, error } = await client
      .from('course_sections')
      .select('*, lessons(*)')
      .eq('course_id', id)
      .order('sort_order', { ascending: true });

    if (!error && dbSections && dbSections.length > 0) {
      return NextResponse.json({ success: true, data: dbSections });
    }

    const sections = mockDb.sections
      .filter((s) => s.course_id === id)
      .sort((a, b) => a.sort_order - b.sort_order);

    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch sections' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Section title is required' }, { status: 400 });
    }

    const client = getSupabaseServerClient();
    const { data: existing } = await client
      .from('course_sections')
      .select('sort_order')
      .eq('course_id', id);

    const sortOrder = (existing?.length || 0) + 1;

    const { data: inserted, error } = await client
      .from('course_sections')
      .insert({
        course_id: id,
        title: title.trim(),
        description: description || '',
        sort_order: sortOrder,
        is_published: true,
      })
      .select()
      .single();

    if (!error && inserted) {
      mockDb.sections.push(inserted);
      return NextResponse.json({ success: true, data: inserted });
    }

    const fallbackSection = {
      id: `sec-${Date.now()}`,
      course_id: id,
      title: title.trim(),
      description: description || '',
      sort_order: sortOrder,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.sections.push(fallbackSection);
    return NextResponse.json({ success: true, data: fallbackSection });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create section' }, { status: 500 });
  }
}
