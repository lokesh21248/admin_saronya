export const dynamic = 'force-dynamic';
// SARVONAYA Mux Direct Upload Endpoint
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { createMuxDirectUpload } from '@/lib/mux/client';

export async function POST() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const uploadData = await createMuxDirectUpload();

    return NextResponse.json({
      success: true,
      data: uploadData,
    });
  } catch (error) {
    console.error('Mux Direct Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create Mux direct upload' }, { status: 500 });
  }
}

