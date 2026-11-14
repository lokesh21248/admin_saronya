export const dynamic = 'force-dynamic';
// SARVONAYA Support Tickets API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { mockDb } from '@/lib/db/mock-db';

export async function GET(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let tickets = mockDb.supportTickets.map((t) => {
      const student = mockDb.profiles.find((p) => p.id === t.student_id);
      return {
        ...t,
        studentName: student?.full_name || 'Student',
        studentEmail: student?.email || 'N/A',
      };
    });

    if (status) {
      tickets = tickets.filter((t) => t.status === status);
    }

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, status, replyMessage, isInternalNote } = await request.json();

    const ticket = mockDb.supportTickets.find((t) => t.id === ticketId);
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (status) ticket.status = status;
    ticket.updated_at = new Date().toISOString();

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update ticket' }, { status: 500 });
  }
}

