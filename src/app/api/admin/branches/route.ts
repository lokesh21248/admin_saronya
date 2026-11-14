export const dynamic = 'force-dynamic';
// SARVONAYA Academic Branches API (GET & POST)
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: mockDb.branches,
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

    // Check code collision
    const upperCode = code.toUpperCase().trim();
    if (mockDb.branches.some((b) => b.code === upperCode)) {
      return NextResponse.json(
        { success: false, error: `Branch with code '${upperCode}' already exists` },
        { status: 409 }
      );
    }

    const newBranch = {
      id: `b1000000-0000-0000-0000-${Math.random().toString(36).substring(2, 14)}`,
      code: upperCode,
      name: name.trim(),
      description: description || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      courses_count: 0,
      students_count: 0,
    };

    mockDb.branches.push(newBranch);

    // Audit log
    mockDb.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminUser.id,
      actor_email: adminUser.email,
      action: 'BRANCH_CREATED',
      entity_type: 'academic_branch',
      entity_id: newBranch.id,
      details: { code: upperCode, name: newBranch.name },
      created_at: new Date().toISOString(),
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

