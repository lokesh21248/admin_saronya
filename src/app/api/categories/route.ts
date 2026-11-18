export const dynamic = 'force-dynamic';
// SARVONAYA Public Categories API (Consumed by saronya.vercel.app)
import { NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const categories = await supabaseDb.categories.list();
    const activeOnly = categories.filter((c) => c.is_active !== false);

    return NextResponse.json(
      {
        success: true,
        total: activeOnly.length,
        data: activeOnly,
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
    console.error('Public Categories GET Error:', error);
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
