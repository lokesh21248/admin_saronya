// SARVONAYA Course Sections API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existingCount = mockDb.sections.filter((s) => s.course_id === id).length;
    const newSection = {
      id: `sec-${Date.now()}`,
      course_id: id,
      title: title.trim(),
      description: description || '',
      sort_order: existingCount + 1,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.sections.push(newSection);

    return NextResponse.json({ success: true, data: newSection });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create section' }, { status: 500 });
  }
}

