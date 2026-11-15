// SARVONAYA Individual Lesson Update API (PATCH)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

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
    const lesson = mockDb.lessons.find((l) => l.id === id);

    if (!lesson) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    Object.assign(lesson, body, { updated_at: new Date().toISOString() });

    return NextResponse.json({ success: true, data: lesson });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const idx = mockDb.lessons.findIndex((l) => l.id === id);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: 'Lesson not found' }, { status: 404 });
    }

    const [deleted] = mockDb.lessons.splice(idx, 1);
    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
      data: deleted,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete lesson' }, { status: 500 });
  }
}

