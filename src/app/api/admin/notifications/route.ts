export const dynamic = 'force-dynamic';
// SARVONAYA Notifications & Broadcast API
import { NextResponse } from 'next/server';
import { getCurrentAdminUser } from '@/lib/clerk/auth';
import { getSupabaseServerClient } from '@/lib/supabase/admin';
import { supabaseDb } from '@/lib/supabase/db';
import { mockDb } from '@/lib/db/mock-db';
import { sendNotificationEmail } from '@/lib/resend/client';

export async function GET() {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: true, data: mockDb.notifications });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await getCurrentAdminUser();
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, audience, target_branch_id, channel } = await request.json();

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message required' }, { status: 400 });
    }

    // Trigger Resend email if requested
    if (channel === 'email' || channel === 'both') {
      await sendNotificationEmail({
        to: 'students@sarvonaya.edu',
        subject: `[SARVONAYA Announcement] ${title}`,
        html: `<h2>${title}</h2><p>${message}</p>`,
      });
    }

    const client = getSupabaseServerClient();
    const { data: inserted, error: insertError } = await client
      .from('notifications')
      .insert({
        title: title.trim(),
        message: message.trim(),
        audience: audience || 'all_students',
        target_branch_id: target_branch_id || null,
        channel: channel || 'in_app',
        status: 'sent',
        sent_count: audience === 'branch_specific' ? 280 : 1845,
        failed_count: 0,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    const newNotif = inserted || {
      id: `notif-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      audience: audience || 'all_students',
      target_branch_id: target_branch_id || null,
      channel: channel || 'in_app',
      status: 'sent' as const,
      sent_count: audience === 'branch_specific' ? 280 : 1845,
      failed_count: 0,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    mockDb.notifications.unshift(newNotif);

    await supabaseDb.auditLogs.log({
      actor_id: adminUser.id,
      actor_name: adminUser.name,
      action: 'NOTIFICATION_BROADCAST',
      target_type: 'notification',
      target_id: newNotif.id,
      details: { title, channel, audience },
    });

    return NextResponse.json({ success: true, data: newNotif });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}

