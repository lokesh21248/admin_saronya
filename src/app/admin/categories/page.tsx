'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  BookOpen,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Code2');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories');
      const json = await res.json();
      if (json.success) {
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
        body: JSON.stringify({ name, description, icon, thumbnail_url: thumbnailUrl }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setName('');
        setDescription('');
        setThumbnailUrl('');
        loadCategories();
      }
    } catch (err) {
      console.error('Error adding category:', err);
    } finally {
      setSubmitting(false);
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
        loadCategories();
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Category Taxonomy
          </h1>
          <p className="text-sm text-slate-500">
            Manage course subject categories, hierarchy, icons and public catalog grouping.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </Button>
      </div>

      {/* Categories Grid Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Category Name</th>
                  <th className="px-6 py-3.5">Slug</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-4 py-3.5">Courses</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Loading categories...
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        #{c.display_order}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-blue-50 text-[#0B3473] flex items-center justify-center">
                            <FolderTree className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-slate-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {c.slug}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {c.description || 'No description'}
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
                            onClick={() => handleToggleStatus(c)}
                            className={c.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                          >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {c.is_active ? 'Deactivate' : 'Activate'}
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
              <Label>Category Name</Label>
              <Input
                placeholder="e.g. Cybersecurity & Ethical Hacking"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Overview of curricula covered in this domain"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-xs"
                rows={3}
              />
            </div>
            <div>
              <FileUpload
                accept="image/*"
                folder="categories"
                label="Category Badge / Thumbnail Image"
                description="Upload custom icon or visual banner for this engineering domain"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Category'}
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

