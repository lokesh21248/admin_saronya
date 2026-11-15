export const dynamic = 'force-dynamic';
// SARVONAYA Instructor Management API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const instructors = await supabaseDb.instructors.list();

    return NextResponse.json({
      success: true,
      data: instructors,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch instructors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { full_name, email, phone, bio, avatar_url } = await request.json();

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 });
    }

    const newInstructor = {
      id: `a1000000-0000-0000-0000-${Math.random().toString(16).substring(2, 14)}`,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || '',
      bio: bio || '',
      avatar_url: avatar_url || '/placeholders/avatar-placeholder.svg',
      status: 'active' as const,
      roles: ['instructor' as const],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.profiles.push(newInstructor);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'INSTRUCTOR_INVITED',
      target_type: 'instructor',
      target_id: newInstructor.id,
      target_name: newInstructor.full_name,
      details: { email: newInstructor.email },
    });

    return NextResponse.json({
      success: true,
      message: 'Instructor invited successfully',
      data: newInstructor,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create instructor' }, { status: 500 });
  }
}
