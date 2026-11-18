export const dynamic = 'force-dynamic';
// SARVONAYA Public Courses API (Consumed by saronya.vercel.app)
import { NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const branch = searchParams.get('branch');
    const search = searchParams.get('search');

    const courses = await supabaseDb.courses.list();
    // Only published courses for public consumption
    let filtered = courses.filter((c) => c.status === 'published' || (c as any).is_published !== false);

    if (category) {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.category_id === category ||
          c.category?.name?.toLowerCase() === catLower ||
          c.category?.slug?.toLowerCase() === catLower ||
          c.category?.name?.toLowerCase().includes(catLower)
      );
    }

    if (branch) {
      filtered = filtered.filter((c) =>
        c.branches?.some((b) => b.id === branch || b.code === branch)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.short_description?.toLowerCase().includes(q) ||
          c.full_description?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(
      {
        success: true,
        total: filtered.length,
        data: filtered,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Public Courses GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error', data: [] }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
