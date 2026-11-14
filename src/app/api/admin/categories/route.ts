export const dynamic = 'force-dynamic';
// SARVONAYA Categories API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const categories = mockDb.categories.sort((a, b) => a.display_order - b.display_order);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, description, icon } = await request.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCategory = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      slug: generatedSlug,
      description: description || '',
      icon: icon || 'Code2',
      is_active: true,
      display_order: mockDb.categories.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      courses_count: 0,
    };

    mockDb.categories.push(newCategory);

    return NextResponse.json({
      success: true,
      data: newCategory,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 });
  }
}

