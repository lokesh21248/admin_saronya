export const dynamic = 'force-dynamic';
// SARVONAYA Public Branches API (Consumed by saronya.vercel.app)
import { NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const branches = await supabaseDb.branches.list();

    return NextResponse.json(
      {
        success: true,
        total: branches.length,
        data: branches,
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
    console.error('Public Branches GET Error:', error);
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
