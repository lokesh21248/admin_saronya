export const dynamic = 'force-dynamic';
// SARVONAYA Support Tickets API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { supabaseDb } from '@/lib/supabase/db';

export async function GET(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const tickets = await supabaseDb.supportTickets.list();

    let enriched = tickets.map((t: any) => ({
      ...t,
      studentName: t.student?.full_name || 'Student',
      studentEmail: t.student?.email || 'N/A',
    }));

    if (status) {
      enriched = enriched.filter((t: any) => t.status === status);
    }

    return NextResponse.json({ success: true, data: enriched });
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

    const { ticketId, status } = await request.json();

    if (ticketId && status) {
      await supabaseDb.supportTickets.updateStatus(ticketId, status);
      await supabaseDb.auditLogs.log({
        actor_id: adminUser.id,
        actor_name: adminUser.name,
        action: `TICKET_${status.toUpperCase()}`,
        target_type: 'support_ticket',
        target_id: ticketId,
        details: { status },
      });
    }

    return NextResponse.json({ success: true, message: 'Ticket status updated' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update ticket' }, { status: 500 });
  }
}
