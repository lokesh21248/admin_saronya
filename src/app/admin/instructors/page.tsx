'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import {
  UserCheck,
  Plus,
  Mail,
  Phone,
  BookOpen,
  Star,
  ShieldCheck,
} from 'lucide-react';

export default function InstructorsManagementPage() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadInstructors() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/instructors');
      const json = await res.json();
      if (json.success) {
        setInstructors(json.data);
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstructors();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone, bio, avatar_url: avatarUrl }),
      });
      if (res.ok) {
        setInviteModalOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setBio('');
        setAvatarUrl('');
        loadInstructors();
      }
    } catch (err) {
      console.error('Failed to invite instructor:', err);
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
            Instructor & Faculty Directory
          </h1>
          <p className="text-sm text-slate-500">
            Manage engineering faculty, course curriculum ownership, and teaching performance.
          </p>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Provision / Invite Faculty</span>
        </Button>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            Loading instructors...
          </div>
        ) : (
          instructors.map((inst) => (
            <Card key={inst.id} className="overflow-hidden border border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-[#0B3473] text-white flex items-center justify-center font-bold text-base border border-slate-200 shrink-0">
                      {inst.avatar_url ? (
                        <img src={inst.avatar_url} alt={inst.full_name} className="h-full w-full object-cover" />
                      ) : (
                        inst.full_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{inst.full_name}</h3>
                      <p className="text-xs text-slate-500">{inst.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={inst.status} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {inst.bio || 'Senior engineering faculty member specializing in industrial systems.'}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-[#0B3473]" />
                    {inst.assignedCoursesCount} Assigned Courses
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {inst.rating} ({inst.reviewsCount})
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New Faculty Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Prof. Ananya Iyer"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Academic / Institutional Email</Label>
              <Input
                type="email"
                placeholder="faculty@sarvonaya.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="+91 98400 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Biography & Domain Expertise</Label>
              <Textarea
                placeholder="Industry experience, research background & core teaching domains"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <FileUpload
                accept="image/*"
                folder="instructors"
                label="Profile Avatar Photo"
                description="Upload square photo for faculty profile and student course view"
                value={avatarUrl}
                onChange={setAvatarUrl}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

