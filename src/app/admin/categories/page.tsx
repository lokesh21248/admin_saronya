'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FileUpload } from '@/components/ui/file-upload';
import {
  FolderTree,
  Plus,
  Edit2,
  Power,
  Trash2,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Code2');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('Code2');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Target
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          icon,
          thumbnail_url: thumbnailUrl.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAddModalOpen(false);
        setName('');
        setDescription('');
        setThumbnailUrl('');
        await loadCategories();
      } else {
        alert(json.error || 'Failed to create category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Error creating category');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenEdit(cat: any) {
    setEditingCategory(cat);
    setEditName(cat.name || '');
    setEditDescription(cat.description || '');
    setEditIcon(cat.icon || 'Code2');
    setEditThumbnailUrl(cat.thumbnail_url || '');
    setEditModalOpen(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    try {
      setEditSubmitting(true);
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
          icon: editIcon,
          thumbnail_url: editThumbnailUrl.trim() || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEditModalOpen(false);
        setEditingCategory(null);
        await loadCategories();
      } else {
        alert(json.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('Error updating category');
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleToggleStatus(cat: any) {
    try {
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      loadCategories();
    } catch (err) {
      console.error('Failed to toggle category:', err);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    try {
      setDeletingCategory(true);
      const res = await fetch(`/api/admin/categories/${deleteCategoryTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDeleteCategoryTarget(null);
        await loadCategories();
      } else {
        alert(json.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Error occurred while deleting category');
    } finally {
      setDeletingCategory(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Category Taxonomy &amp; Icons
            </h1>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Supabase Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage course domains, upload custom badge images, configure titles, and organize student homepage groupings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            className="gap-1 text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setName('');
              setDescription('');
              setThumbnailUrl('');
              setAddModalOpen(true);
            }}
            className="gap-2 bg-[#0B3473] hover:bg-[#082654] text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* Categories Grid Table */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Category &amp; Image</th>
                  <th className="px-4 py-3.5">Courses</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B3473] mb-2" />
                      Loading categories from Supabase...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      No categories found. Click &apos;Add Category&apos; above to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Uploaded Thumbnail Preview */}
                          {c.thumbnail_url ? (
                            <div className="relative h-10 w-10 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                              <img
                                src={c.thumbnail_url}
                                alt={c.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0B3473] border border-blue-100 flex items-center justify-center shrink-0">
                              <FolderTree className="h-5 w-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{c.name}</span>
                              <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {c.slug}
                              </span>
                              {c.thumbnail_url && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                                  Custom Image
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {c.courses_count || 0} Courses
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-[#0B3473] hover:bg-blue-50"
                            title="Edit Category & Image"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(c)}
                            className={`h-8 w-8 p-0 ${c.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={c.is_active ? 'Deactivate Category' : 'Activate Category'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Category"
                            onClick={() => setDeleteCategoryTarget(c)}
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

      {/* Add Category Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Course Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Category Name *</Label>
              <Input
                placeholder="e.g. Cybersecurity & Ethical Hacking"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Description</Label>
              <Textarea
                placeholder="Overview of curricula covered in this domain"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-xs"
                rows={2}
              />
            </div>
            <div>
              <FileUpload
                accept="image/*"
                folder="categories"
                bucket="banners"
                label="Category Badge / Thumbnail Image"
                description="Upload custom icon or image badge (saved to Supabase Storage)"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0B3473] text-white" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category &amp; Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Category Name *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-700">Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1 text-xs"
                rows={2}
              />
            </div>
            <div>
              <FileUpload
                accept="image/*"
                folder="categories"
                bucket="banners"
                label="Category Badge / Thumbnail Image"
                description="Upload or replace the custom image badge (shown on student frontend)"
                value={editThumbnailUrl}
                onChange={setEditThumbnailUrl}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0B3473] text-white" disabled={editSubmitting}>
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Category */}
      {deleteCategoryTarget && (
        <ConfirmDialog
          open={Boolean(deleteCategoryTarget)}
          onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
          title="Delete Category"
          description={`Are you sure you want to delete category "${deleteCategoryTarget.name}"? Courses associated with this category will become unassigned.`}
          confirmLabel={deletingCategory ? 'Deleting...' : 'Delete Category'}
          isDestructive={true}
          onConfirm={handleDeleteCategory}
        />
      )}
    </div>
  );
}
