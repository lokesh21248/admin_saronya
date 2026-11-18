'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/admin/status-badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Globe,
  Sliders,
  Layers,
  Smartphone,
  Monitor,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  RefreshCw,
} from 'lucide-react';
import type { HeroBanner } from '@/types/database';

export default function WebsiteHeroBannersPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroBanner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formButtonText, setFormButtonText] = useState('Explore Courses');
  const [formButtonLink, setFormButtonLink] = useState('/courses');
  const [formImageUrl, setFormImageUrl] = useState('/images/mockup/hero-student-3d.png');
  const [formMobileImageUrl, setFormMobileImageUrl] = useState('/images/mockup/hero-mobile-banner-2x.png');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formActive, setFormActive] = useState(true);

  async function loadBanners() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/banners');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Sort by display_order
        const sorted = [...json.data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setBanners(sorted);
      }
    } catch (err) {
      console.error('Error loading hero banners:', err);
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
    setFormTitle('Learn Anytime, Anywhere');
    setFormSubtitle('Upgrade your skills with expert-led online courses and take your career to the next level.');
    setFormButtonText('Explore Courses');
    setFormButtonLink('/courses');
    setFormImageUrl('/images/mockup/hero-student-3d.png');
    setFormMobileImageUrl('/images/mockup/hero-mobile-banner-2x.png');
    setFormOrder(banners.length + 1);
    setFormActive(true);
    setModalOpen(true);
  }

  function handleOpenEdit(b: HeroBanner) {
    setEditingBanner(b);
    setFormTitle(b.title || '');
    setFormSubtitle(b.subtitle || '');
    setFormButtonText(b.button_text || 'Explore Courses');
    setFormButtonLink(b.button_link || '/courses');
    setFormImageUrl(b.image_url || '/images/mockup/hero-student-3d.png');
    setFormMobileImageUrl(b.mobile_image_url || '/images/mockup/hero-mobile-banner-2x.png');
    setFormOrder(b.display_order || 1);
    setFormActive(b.is_active);
    setModalOpen(true);
  }

  async function handleSaveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Banner Heading is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        button_text: formButtonText.trim() || 'Explore Courses',
        button_link: formButtonLink.trim() || '/courses',
        image_url: formImageUrl.trim(),
        mobile_image_url: formMobileImageUrl.trim(),
        display_order: Number(formOrder) || 1,
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
        await loadBanners();
      } else {
        alert(json.error || 'Failed to save hero banner');
      }
    } catch (err) {
      console.error('Error saving banner:', err);
      alert('An unexpected error occurred while saving the banner.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(banner: HeroBanner) {
    try {
      setTogglingId(banner.id);
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !banner.is_active }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
        );
      }
    } catch (err) {
      console.error('Error toggling banner:', err);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleReorder(banner: HeroBanner, direction: 'up' | 'down') {
    const currentIndex = banners.findIndex((b) => b.id === banner.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const targetBanner = banners[targetIndex];
    const newCurrentOrder = targetBanner.display_order;
    const newTargetOrder = banner.display_order;

    try {
      await Promise.all([
        fetch(`/api/admin/banners/${banner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: newCurrentOrder }),
        }),
        fetch(`/api/admin/banners/${targetBanner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_order: newTargetOrder }),
        }),
      ]);
      await loadBanners();
    } catch (err) {
      console.error('Error reordering banners:', err);
    }
  }

  async function handleDeleteBanner() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/banners/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
        setDeleteTarget(null);
        if (activeSlideIndex > 0) setActiveSlideIndex(0);
      } else {
        alert('Failed to delete hero banner');
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Homepage Hero Banners</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Homepage API
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage the hero banner carousel displayed on the Saryonaya student homepage. Upload desktop & mobile images, edit headings, buttons, and ordering.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBanners}
            className="flex items-center gap-1 text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-[#0B3473] hover:bg-[#082857] text-white flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Banner
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Banners</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{banners.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0B3473] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active Live</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{activeBanners.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inactive</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{banners.length - activeBanners.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Supabase Storage</p>
              <p className="text-xs font-bold text-slate-800 mt-1">Bucket: &apos;banners&apos;</p>
              <span className="text-[11px] text-emerald-600 font-medium">Public RLS Verified</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Interactive Hero Banner Preview */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3.5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#0B3473]" />
              <CardTitle className="text-base font-semibold text-slate-900">
                Live Homepage Carousel Preview
              </CardTitle>
              {currentPreviewBanner && (
                <span className="text-xs text-slate-500">
                  (Showing Slide {activeSlideIndex + 1} of {activeBanners.length || 1})
                </span>
              )}
            </div>

            {/* View Mode & Slide Controls */}
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                    previewMode === 'desktop'
                      ? 'bg-[#0B3473] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                    previewMode === 'mobile'
                      ? 'bg-[#0B3473] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Mobile (393px)
                </button>
              </div>

              {activeBanners.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlideIndex((prev) => (prev > 0 ? prev - 1 : activeBanners.length - 1))
                    }
                    className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSlideIndex((prev) => (prev < activeBanners.length - 1 ? prev + 1 : 0))
                    }
                    className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 bg-slate-100/60 flex items-center justify-center">
          {currentPreviewBanner ? (
            previewMode === 'desktop' ? (
              /* Desktop Hero Banner Preview (Matches Saryonaya Homepage Hero) */
              <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-[#102B50] via-[#143663] to-[#0A1F3B] text-white border border-white/10 relative p-8 md:p-12">
                {/* Background decorative waves / glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-7 space-y-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-300 font-semibold tracking-wide">
                      <Sparkles className="w-3.5 h-3.5" />
                      PREMIUM EDUCATION PLATFORM
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
                      {currentPreviewBanner.title}
                    </h2>
                    <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-xl">
                      {currentPreviewBanner.subtitle || 'Upgrade your skills with expert-led online courses and take your career to the next level.'}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <a
                        href={currentPreviewBanner.button_link || '/courses'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-sm shadow-lg shadow-amber-400/25 hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer"
                      >
                        {currentPreviewBanner.button_text || 'Explore Courses'}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                      <span className="text-xs text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Accredited Certificates
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex justify-center items-center">
                    <div className="relative w-72 h-72 md:w-80 md:h-80 drop-shadow-2xl">
                      {currentPreviewBanner.image_url ? (
                        <Image
                          src={currentPreviewBanner.image_url}
                          alt={currentPreviewBanner.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 288px, 320px"
                          className="object-contain"
                          onError={(e) => {
                            // Fallback if image fails
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <ImageIcon className="w-12 h-12 text-slate-500 mb-2" />
                          <p className="text-xs">No desktop image uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slide indicator dots */}
                {activeBanners.length > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {activeBanners.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveSlideIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === activeSlideIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Mobile View Preview (Matches iPhone 16 viewport from user screenshot) */
              <div className="w-[340px] sm:w-[380px] bg-white rounded-[38px] shadow-2xl border-4 border-slate-800 overflow-hidden relative">
                {/* Mobile screen notch / header bar */}
                <div className="bg-slate-900 text-white text-[11px] py-1.5 px-6 flex justify-between items-center font-medium">
                  <span>9:41</span>
                  <div className="w-16 h-4 bg-black rounded-full" />
                  <span className="flex items-center gap-1">5G 100%</span>
                </div>

                {/* Saryonaya Mobile Mock Header */}
                <div className="bg-white p-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-[#0B3473] text-amber-400 font-black text-xs flex items-center justify-center">
                      S
                    </div>
                    <span className="font-bold text-xs text-[#0B3473] tracking-wide">SARYONAYA</span>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                    Student App
                  </span>
                </div>

                {/* Mobile Banner Graphic */}
                <div className="p-3 bg-slate-50">
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-[#102B50] to-[#0A1F3B] text-white">
                    {currentPreviewBanner.mobile_image_url ? (
                      <div className="relative w-full aspect-[16/9]">
                        <Image
                          src={currentPreviewBanner.mobile_image_url}
                          alt={currentPreviewBanner.title}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 340px, 380px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-4 space-y-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900">
                          FEATURED
                        </span>
                        <h3 className="text-base font-bold leading-tight">{currentPreviewBanner.title}</h3>
                        <p className="text-[11px] text-slate-300 line-clamp-2">{currentPreviewBanner.subtitle}</p>
                        <a
                          href={currentPreviewBanner.button_link || '/courses'}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 pt-1"
                        >
                          {currentPreviewBanner.button_text || 'Explore Courses'} &rarr;
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Indicator dots for mobile */}
                  {activeBanners.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2.5">
                      {activeBanners.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${
                            i === activeSlideIndex ? 'w-5 bg-[#0B3473]' : 'w-1.5 bg-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mock Mobile Bottom Search & Content */}
                <div className="p-3 space-y-2 bg-white">
                  <div className="h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs flex items-center px-3 gap-2">
                    <span>Search courses...</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                      Popular Courses
                    </div>
                    <div className="h-10 flex-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                      Certificates
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No active hero banners configured</p>
              <p className="text-xs text-slate-400 mt-1">Click &apos;Add New Banner&apos; above to create your first dynamic homepage banner.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner Management Table & Ordering */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Configured Hero Banners</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag, reorder, or toggle live visibility on the student homepage.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {banners.length} total banner{banners.length !== 1 ? 's' : ''}
          </span>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0B3473] mb-2" />
              <p className="text-sm font-medium">Loading banners from Supabase...</p>
            </div>
          ) : banners.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No hero banners found</p>
              <p className="text-xs text-slate-400 mt-1">Add a banner to control what students see at the top of the homepage.</p>
              <Button onClick={handleOpenCreate} size="sm" className="mt-4 bg-[#0B3473]">
                <Plus className="w-4 h-4 mr-1" /> Create First Banner
              </Button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Order</th>
                  <th className="py-3 px-4 w-28">Preview</th>
                  <th className="py-3 px-4">Heading &amp; Subtitle</th>
                  <th className="py-3 px-4">Button Action</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {banners.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Display Order with Up / Down Controls */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorder(b, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">
                          {b.display_order ?? idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === banners.length - 1}
                          onClick={() => handleReorder(b, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Image Thumbnail (Desktop & Mobile) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {/* Desktop Thumbnail */}
                        <div
                          className="relative w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
                          title="Desktop Creative"
                        >
                          {b.image_url ? (
                            <Image
                              src={b.image_url}
                              alt="Desktop Banner"
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-contain p-0.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                              No img
                            </div>
                          )}
                        </div>
                        {/* Mobile Thumbnail */}
                        <div
                          className="relative w-7 h-10 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
                          title="Mobile Creative"
                        >
                          {b.mobile_image_url ? (
                            <Image
                              src={b.mobile_image_url}
                              alt="Mobile Banner"
                              fill
                              unoptimized
                              sizes="28px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                              -
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Heading and Subtitle */}
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-900 leading-snug">{b.title}</div>
                      {b.subtitle && (
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{b.subtitle}</div>
                      )}
                    </td>

                    {/* CTA Details */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-[#0B3473] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          {b.button_text || 'Explore Courses'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500 font-mono">{b.button_link || '/courses'}</span>
                      </div>
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={b.is_active}
                          disabled={togglingId === b.id}
                          onCheckedChange={() => handleToggleStatus(b)}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            b.is_active ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {b.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(b)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                          title="Edit Banner"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(b)}
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Hero Banner Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBanner} className="space-y-5 pt-2">
            {/* Banner Heading */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Banner Heading / Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Learn Anytime, Anywhere"
                required
                className="font-medium text-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                Primary large typography on the hero banner.
              </p>
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Banner Subtitle / Description</Label>
              <Textarea
                rows={2}
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="e.g. Upgrade your skills with expert-led online courses and take your career to the next level."
              />
            </div>

            {/* Button Settings (Text & Link) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Button Call-to-Action Text</Label>
                <Input
                  value={formButtonText}
                  onChange={(e) => setFormButtonText(e.target.value)}
                  placeholder="e.g. Explore Courses"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Button Link URL</Label>
                <Input
                  value={formButtonLink}
                  onChange={(e) => setFormButtonLink(e.target.value)}
                  placeholder="e.g. /courses or /subscriptions"
                />
              </div>
            </div>

            {/* Image Uploaders: Desktop and Mobile */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Banner Creatives &amp; Images
                </span>
                <span className="text-[11px] text-slate-500">
                  Uploaded to Supabase Bucket: <code className="bg-slate-200 px-1 py-0.5 rounded">banners</code>
                </span>
              </div>

              {/* Desktop Image */}
              <div className="space-y-1.5">
                <FileUpload
                  label="Desktop Graphic (3D Illustration / Character)"
                  description="Recommended size: 600x600px PNG or SVG with transparent background"
                  value={formImageUrl}
                  onChange={(url) => setFormImageUrl(url)}
                  bucket="banners"
                  folder="hero-desktop"
                  accept="image/*"
                />
              </div>

              {/* Mobile Image */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <FileUpload
                  label="Mobile Responsive Banner (Card / Mobile Screen)"
                  description="Recommended size: 750x420px (16:9) PNG or WEBP for mobile viewports"
                  value={formMobileImageUrl}
                  onChange={(url) => setFormMobileImageUrl(url)}
                  bucket="banners"
                  folder="hero-mobile"
                  accept="image/*"
                />
              </div>
            </div>

            {/* Display Order & Active Switch */}
            <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Display Order</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-24 bg-white"
                />
                <span className="text-[10px] text-slate-500">Lower numbers appear first</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <div className="text-right">
                  <Label className="text-xs font-semibold text-slate-700 block">Status</Label>
                  <span className="text-[11px] text-slate-500">
                    {formActive ? 'Active on homepage' : 'Hidden from students'}
                  </span>
                </div>
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#0B3473] hover:bg-[#082857] text-white"
              >
                {submitting ? 'Saving to Database...' : editingBanner ? 'Save Changes' : 'Create Banner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Homepage Hero Banner?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This banner will immediately be removed from the student homepage.`}
        confirmLabel="Delete Banner"
        isDestructive={true}
        onConfirm={handleDeleteBanner}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
