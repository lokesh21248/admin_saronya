'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import {
  Bell,
  Plus,
  Send,
  Mail,
  Smartphone,
  Users,
  CheckCircle,
} from 'lucide-react';

export default function NotificationsManagementPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all_students' | 'branch_specific'>('all_students');
  const [channel, setChannel] = useState<'in_app' | 'email' | 'both'>('both');
  const [submitting, setSubmitting] = useState(false);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, audience, channel }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setTitle('');
        setMessage('');
        loadNotifications();
      }
    } catch (err) {
      console.error('Failed to send notification:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Notifications & Announcements
          </h1>
          <p className="text-sm text-slate-500">
            Dispatch in-app updates, push notifications and transactional email blasts via Resend.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>New Notification Broadcast</span>
        </Button>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Notification Title & Message</th>
                  <th className="px-4 py-3.5">Audience Scope</th>
                  <th className="px-4 py-3.5">Channel</th>
                  <th className="px-4 py-3.5">Recipients Delivered</th>
                  <th className="px-4 py-3.5">Sent Timestamp</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading broadcast notifications...
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="capitalize text-xs font-semibold text-slate-700">
                          {n.audience.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0B3473] border border-blue-200">
                          {n.channel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-800">
                        {n.sent_count} Students
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDateTime(n.sent_at)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={n.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Broadcast Platform Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSend} className="space-y-4 pt-2">
            <div>
              <Label>Subject / Title</Label>
              <Input
                placeholder="e.g. Schedule Update: Live VLSI Workshop on Saturday"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Notification Content</Label>
              <Textarea
                placeholder="Write the announcement message to display in student notifications"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Audience</Label>
                <select
                  value={audience}
                  onChange={(e: any) => setAudience(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="all_students">All Students</option>
                  <option value="branch_specific">Branch Specific</option>
                </select>
              </div>
              <div>
                <Label>Channel</Label>
                <select
                  value={channel}
                  onChange={(e: any) => setChannel(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="both">In-App + Email (Resend)</option>
                  <option value="in_app">In-App Only</option>
                  <option value="email">Email Only</option>
                </select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Broadcasting...' : 'Broadcast Now'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

