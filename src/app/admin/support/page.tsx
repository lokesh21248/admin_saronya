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
  LifeBuoy,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  User,
  Send,
} from 'lucide-react';

export default function SupportManagementPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  async function loadTickets() {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/admin/support?status=${statusFilter}` : '/api/admin/support';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  async function handleSendReply() {
    if (!activeTicket || !replyText.trim()) return;
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          status: 'resolved',
          replyMessage: replyText,
        }),
      });
      if (res.ok) {
        setActiveTicket(null);
        setReplyText('');
        loadTickets();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Support & Helpdesk
          </h1>
          <p className="text-sm text-slate-500">
            Resolve student technical inquiries, billing tickets, video buffering issues and course support.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700"
            >
              <option value="">All Ticket Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Ticket #</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Subject & Category</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading tickets...
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-[#0B3473]">
                        {t.ticket_number}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900">{t.studentName}</p>
                        <p className="text-[11px] text-slate-400">{t.studentEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-xs text-slate-800">{t.subject}</p>
                        <span className="text-[10px] text-slate-400">{t.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDateTime(t.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTicket(t)}
                          className="h-8 text-xs text-[#0B3473]"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Respond
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Response Modal */}
      {activeTicket && (
        <Dialog open={Boolean(activeTicket)} onOpenChange={(open) => !open && setActiveTicket(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Respond to Ticket {activeTicket.ticket_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900">{activeTicket.subject}</p>
                <p className="text-slate-500 mt-1">From: {activeTicket.studentName} ({activeTicket.studentEmail})</p>
              </div>

              <div>
                <Label>Resolution / Support Message</Label>
                <Textarea
                  placeholder="Type official response to student..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="mt-1 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTicket(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="default" onClick={handleSendReply}>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send & Resolve Ticket
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

