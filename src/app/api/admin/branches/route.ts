export const dynamic = 'force-dynamic';
// SARVONAYA Academic Branches API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const branches = await supabaseDb.branches.list();

    return NextResponse.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    console.error('Branches GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { code, name, description } = await request.json();

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: 'Branch code and name are required' },
        { status: 400 }
      );
    }

    const newBranch = await supabaseDb.branches.create({
      code,
      name,
      description,
    });

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'BRANCH_CREATED',
      target_type: 'academic_branch',
      target_id: newBranch.id,
      target_name: newBranch.name,
      details: { code: newBranch.code },
    });

    return NextResponse.json({
      success: true,
      message: 'Branch created successfully',
      data: newBranch,
    });
  } catch (error) {
    console.error('Branches POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
