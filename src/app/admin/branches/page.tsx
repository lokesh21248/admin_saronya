'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import {
  GraduationCap,
  Plus,
  Edit2,
  Power,
  BookOpen,
  Users,
  Info,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export default function AcademicBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [toggleTarget, setToggleTarget] = useState<any>(null);
  const [deleteBranchTarget, setDeleteBranchTarget] = useState<any>(null);
  const [deletingBranch, setDeletingBranch] = useState(false);

  // New Branch Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadBranches() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/branches');
      const json = await res.json();
      if (json.success) {
        setBranches(json.data);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode, name: newName, description: newDesc }),
      });
      const json = await res.json();
      if (json.success) {
        setAddModalOpen(false);
        setNewCode('');
        setNewName('');
        setNewDesc('');
        loadBranches();
      } else {
        alert(json.error || 'Failed to create branch');
      }
    } catch (err) {
      console.error('Error creating branch:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateBranch(e: React.FormEvent) {
    e.preventDefault();
    if (!editBranch) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/branches/${editBranch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editBranch.name, description: editBranch.description }),
      });
      if (res.ok) {
        setEditBranch(null);
        loadBranches();
      }
    } catch (err) {
      console.error('Error updating branch:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return;
    try {
      const res = await fetch(`/api/admin/branches/${toggleTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !toggleTarget.is_active }),
      });
      if (res.ok) {
        setToggleTarget(null);
        loadBranches();
      }
    } catch (err) {
      console.error('Failed to toggle branch status:', err);
    }
  }

  async function handleDeleteBranch() {
    if (!deleteBranchTarget) return;
    try {
      setDeletingBranch(true);
      const res = await fetch(`/api/admin/branches/${deleteBranchTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDeleteBranchTarget(null);
        loadBranches();
      } else {
        alert(json.error || 'Failed to delete branch');
      }
    } catch (err) {
      console.error('Error deleting branch:', err);
      alert('Error occurred while deleting branch');
    } finally {
      setDeletingBranch(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Academic Branch Management
          </h1>
          <p className="text-sm text-slate-500">
            Configure academic branches, student disciplinary streams, and branch-level course visibility rules.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Academic Branch</span>
        </Button>
      </div>

      {/* Preservation Policy Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700">
        <Info className="h-5 w-5 text-[#0B3473] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#0B3473]">Enterprise Referential Integrity Rule</p>
          <p className="text-slate-600">
            Branches with enrolled students or mapped courses cannot be deleted. Deactivate branches instead to hide them from future enrollment options while preserving all historical transcripts and certificates.
          </p>
        </div>
      </div>

      {/* Branches Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Branch Code</th>
                  <th className="px-6 py-3.5">Discipline Name</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Mapped Courses</th>
                  <th className="px-4 py-3.5">Students</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading academic branches...
                    </td>
                  </tr>
                ) : (
                  branches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#0B3473]/10 text-[#0B3473] border border-[#0B3473]/20">
                          {b.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{b.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {b.description || 'No description provided'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          {b.courses_count || 0} Courses
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {b.students_count || 0} Learners
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={b.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-[#0B3473]"
                            title="Edit Branch"
                            onClick={() => setEditBranch({ ...b })}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${b.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={b.is_active ? 'Deactivate Branch' : 'Activate Branch'}
                            onClick={() => setToggleTarget(b)}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete Branch"
                            onClick={() => setDeleteBranchTarget(b)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Branch Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Academic Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBranch} className="space-y-4 pt-2">
            <div>
              <Label>Branch Code (e.g. CSE, ECE, ROBOTICS)</Label>
              <Input
                placeholder="Unique alphanumeric code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                required
                className="mt-1 font-mono uppercase text-xs"
              />
            </div>
            <div>
              <Label>Full Discipline Name</Label>
              <Input
                placeholder="e.g. Computer Science and Engineering"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Description / Academic Scope</Label>
              <Textarea
                placeholder="Overview of specialization, target curriculum and prerequisites"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="mt-1 text-xs"
                rows={3}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Modal */}
      {editBranch && (
        <Dialog open={Boolean(editBranch)} onOpenChange={(open) => !open && setEditBranch(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Academic Branch ({editBranch.code})</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateBranch} className="space-y-4 pt-2">
              <div>
                <Label>Discipline Name</Label>
                <Input
                  value={editBranch.name}
                  onChange={(e) => setEditBranch({ ...editBranch, name: e.target.value })}
                  required
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editBranch.description || ''}
                  onChange={(e) => setEditBranch({ ...editBranch, description: e.target.value })}
                  className="mt-1 text-xs"
                  rows={3}
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setEditBranch(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="default" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Toggle Active/Inactive */}
      {toggleTarget && (
        <ConfirmDialog
          open={Boolean(toggleTarget)}
          onOpenChange={(open) => !open && setToggleTarget(null)}
          title={`${toggleTarget.is_active ? 'Deactivate' : 'Activate'} Branch`}
          description={`Are you sure you want to ${toggleTarget.is_active ? 'deactivate' : 'activate'} the ${toggleTarget.name} (${toggleTarget.code}) branch? Historical records will remain intact.`}
          confirmLabel={toggleTarget.is_active ? 'Deactivate Branch' : 'Activate Branch'}
          isDestructive={toggleTarget.is_active}
          onConfirm={handleToggleStatus}
        />
      )}

      {/* Confirmation Dialog for Permanently Deleting Branch */}
      {deleteBranchTarget && (
        <ConfirmDialog
          open={Boolean(deleteBranchTarget)}
          onOpenChange={(open) => !open && setDeleteBranchTarget(null)}
          title="Delete Academic Branch"
          description={`Are you sure you want to permanently delete the "${deleteBranchTarget.name} (${deleteBranchTarget.code})" branch? All course mappings associated with this discipline will be cleared. This action cannot be reversed.`}
          confirmLabel={deletingBranch ? 'Deleting...' : 'Delete Branch'}
          isDestructive={true}
          onConfirm={handleDeleteBranch}
        />
      )}
    </div>
  );
}

