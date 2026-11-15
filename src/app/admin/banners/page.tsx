'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  Crown,
  ExternalLink,
  Eye,
  Globe,
  Sliders,
  Layers,
} from 'lucide-react';
import type { PromotionalBanner } from '@/types/database';

export default function WebsiteBannersPage() {
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromotionalBanner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formBadge, setFormBadge] = useState('ALL-ACCESS PASS');
  const [formCallout, setFormCallout] = useState('Save 45% This Month');
  const [formDescription, setFormDescription] = useState('');
  const [formCtaText, setFormCtaText] = useState('Explore All-Access Passes');
  const [formCtaUrl, setFormCtaUrl] = useState('/subscriptions');
  const [formBgColor, setFormBgColor] = useState('#0B3473');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formActive, setFormActive] = useState(true);

  async function loadBanners() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/banners');
      const json = await res.json();
      if (json.success) {
        setBanners(json.data);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  const activeBanners = banners.filter((b) => b.is_active);
  const currentPreviewBanner = activeBanners[activeSlideIndex] || banners[0] || null;

  function handleOpenCreate() {
    setEditingBanner(null);
    setFormTitle('');
    setFormBadge('ALL-ACCESS PASS');
    setFormCallout('Save 45% This Month');
    setFormDescription('Get full access to all 500+ premium courses, live mentor doubt clearing, and verified certificates.');
    setFormCtaText('Explore All-Access Passes');
    setFormCtaUrl('/subscriptions');
    setFormBgColor('#0B3473');
    setFormOrder(banners.length + 1);
    setFormActive(true);
    setModalOpen(true);
  }

  function handleOpenEdit(b: PromotionalBanner) {
    setEditingBanner(b);
    setFormTitle(b.title);
    setFormBadge(b.badge_text || '');
    setFormCallout(b.callout_text || '');
    setFormDescription(b.description || '');
    setFormCtaText(b.cta_text || 'Explore Now');
    setFormCtaUrl(b.cta_url || '/subscriptions');
    setFormBgColor(b.background_color || '#0B3473');
    setFormOrder(b.display_order || 1);
    setFormActive(b.is_active);
    setModalOpen(true);
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        badge_text: formBadge.trim(),
        callout_text: formCallout.trim(),
        description: formDescription.trim(),
        cta_text: formCtaText.trim(),
        cta_url: formCtaUrl.trim(),
        background_color: formBgColor,
        display_order: Number(formOrder),
        is_active: formActive,
      };

      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setModalOpen(false);
        loadBanners();
      } else {
        alert(json.error || 'Failed to save banner');
      }
    } catch (err) {
      console.error('Error saving banner:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(banner: PromotionalBanner) {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      if (res.ok) {
        loadBanners();
      }
    } catch (err) {
      console.error('Error toggling banner:', err);
    }
  }

  async function handleDeleteBanner() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/banners/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setDeleteTarget(null);
        loadBanners();
      } else {
        alert(json.error || 'Failed to delete banner');
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Customer Website Banners
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#0B3473] border border-blue-200">
              <Globe className="h-3 w-3" />
              saronya.vercel.app
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure promotional hero banners, discount offers, and subscription callouts displayed on the student portal.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Add Promotional Banner</span>
        </Button>
      </div>

      {/* Customer Website Live Visual Simulation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span className="flex items-center gap-1.5 text-slate-700">
            <Eye className="h-4 w-4 text-[#0B3473]" />
            Live Customer Preview (Carousel Simulation)
          </span>
          {activeBanners.length > 1 && (
            <span className="text-[11px] font-mono text-slate-400">
              Slide {activeSlideIndex + 1} of {activeBanners.length}
            </span>
          )}
        </div>

        {currentPreviewBanner ? (
          <div
            style={{ backgroundColor: currentPreviewBanner.background_color || '#0B3473' }}
            className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg transition-all duration-300 min-h-[190px] flex flex-col justify-between"
          >
            {/* Subtle decorative background glow */}
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            {/* Badges / Header Line */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 z-10">
              {currentPreviewBanner.badge_text && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#F5BD24]/20 text-[#F5BD24] border border-[#F5BD24]/40 tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  {currentPreviewBanner.badge_text}
                </span>
              )}
              {currentPreviewBanner.callout_text && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-200">
                  <Crown className="h-3.5 w-3.5 text-[#F5BD24]" />
                  {currentPreviewBanner.callout_text}
                </span>
              )}
            </div>

            {/* Main Headline & Description */}
            <div className="mt-3 mb-4 max-w-2xl z-10 space-y-1.5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {currentPreviewBanner.title}
              </h2>
              {currentPreviewBanner.description && (
                <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-xl">
                  {currentPreviewBanner.description}
                </p>
              )}
            </div>

            {/* Bottom Row: CTA & Carousel Controls */}
            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10">
              <a
                href={currentPreviewBanner.cta_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5BD24] px-4 py-2 text-xs font-bold text-[#0B3473] hover:bg-[#e0ab1d] shadow-sm transition-colors"
              >
                <span>{currentPreviewBanner.cta_text || 'Explore Passes'}</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              {/* Right Crown Emblem & Navigation Buttons */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-[#F5BD24]">
                  <Crown className="h-5 w-5" />
                </div>
                {activeBanners.length > 1 && (
                  <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg backdrop-blur-xs">
                    <button
                      onClick={() =>
                        setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : activeBanners.length - 1))
                      }
                      className="p-1.5 rounded hover:bg-white/20 transition-colors"
                      title="Previous Slide"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveSlideIndex((prev) => (prev < activeBanners.length - 1 ? prev + 1 : 0))
                      }
                      className="p-1.5 rounded hover:bg-white/20 transition-colors"
                      title="Next Slide"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            No active banners found. Create your first promotional banner below.
          </div>
        )}
      </div>

      {/* Banners List & Configuration Table */}
      <Card>
        <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900">
            Active Banners Catalog ({banners.length})
          </CardTitle>
          <div className="text-xs text-slate-400">
            Ordered by priority for customer carousel
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Headline & Badges</th>
                  <th className="px-4 py-3.5">Description</th>
                  <th className="px-4 py-3.5">CTA Action</th>
                  <th className="px-3 py-3.5 text-center">Order</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading promotional banners...
                    </td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No banners found. Click &quot;Add Promotional Banner&quot; above to create one.
                    </td>
                  </tr>
                ) : (
                  banners.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: b.background_color || '#0B3473' }}
                            className="h-9 w-9 rounded-lg shrink-0 flex items-center justify-center text-white border border-black/10 shadow-xs"
                          >
                            <Crown className="h-4 w-4 text-[#F5BD24]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {b.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {b.badge_text && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  {b.badge_text}
                                </span>
                              )}
                              {b.callout_text && (
                                <span className="text-[11px] text-slate-500 truncate">
                                  {b.callout_text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {b.description || '—'}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="font-semibold text-slate-800">{b.cta_text || 'Explore'}</div>
                        <div className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                          {b.cta_url || '/subscriptions'}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center font-mono text-xs font-bold text-slate-600">
                        #{b.display_order}
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
                            title="Edit Banner"
                            onClick={() => handleOpenEdit(b)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${b.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={b.is_active ? 'Deactivate Banner' : 'Activate Banner'}
                            onClick={() => handleToggleStatus(b)}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Delete Banner"
                            onClick={() => setDeleteTarget(b)}
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

      {/* Add / Edit Banner Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBanner} className="space-y-4 pt-2">
            {/* Live modal preview snippet */}
            <div
              style={{ backgroundColor: formBgColor }}
              className="p-4 rounded-xl text-white space-y-1.5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                {formBadge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5BD24]/20 text-[#F5BD24] border border-[#F5BD24]/40">
                    {formBadge}
                  </span>
                )}
                {formCallout && (
                  <span className="text-[11px] text-amber-200 font-semibold">{formCallout}</span>
                )}
              </div>
              <p className="font-bold text-sm sm:text-base leading-snug">
                {formTitle || 'Your Headline Goes Here'}
              </p>
              <p className="text-[11px] text-slate-200 truncate">
                {formDescription || 'Detailed offer subtext description'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Headline / Title *</Label>
                <Input
                  placeholder="e.g. Unlock Unlimited Learning"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label>Badge Tag (Gold Pill)</Label>
                <Input
                  placeholder="e.g. ALL-ACCESS PASS"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label>Offer Callout Text</Label>
                <Input
                  placeholder="e.g. Save 45% This Month"
                  value={formCallout}
                  onChange={(e) => setFormCallout(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Subtext / Description</Label>
                <Textarea
                  placeholder="Detailed value proposition or syllabus highlights..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label>CTA Button Text</Label>
                <Input
                  placeholder="e.g. Explore All-Access Passes"
                  value={formCtaText}
                  onChange={(e) => setFormCtaText(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label>Destination URL</Label>
                <Input
                  placeholder="e.g. /subscriptions or /courses"
                  value={formCtaUrl}
                  onChange={(e) => setFormCtaUrl(e.target.value)}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label>Theme Background Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={formBgColor}
                    onChange={(e) => setFormBgColor(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={formBgColor}
                    onChange={(e) => setFormBgColor(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <Label>Display Priority Order</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Switch checked={formActive} onCheckedChange={setFormActive} />
                <span className="text-xs font-semibold text-slate-700">
                  {formActive ? 'Active on Student Portal' : 'Inactive (Hidden)'}
                </span>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete Promotional Banner"
          description={`Are you sure you want to permanently delete the banner "${deleteTarget.title}"? It will be removed from the customer website carousel.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete Banner'}
          isDestructive={true}
          onConfirm={handleDeleteBanner}
        />
      )}
    </div>
  );
}
