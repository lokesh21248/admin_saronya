'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { VideoUploader } from '@/components/admin/video-uploader';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  GraduationCap,
  FolderTree,
  CreditCard,
  Layers,
  Video,
  HelpCircle,
  Eye,
  Rocket,
} from 'lucide-react';

const WIZARD_STEPS = [
  { id: 1, name: 'Basic Details', icon: BookOpen },
  { id: 2, name: 'Promotional Media', icon: ImageIcon },
  { id: 3, name: 'Branch Mapping', icon: GraduationCap },
  { id: 4, name: 'Category & Faculty', icon: FolderTree },
  { id: 5, name: 'Pricing & Passes', icon: CreditCard },
  { id: 6, name: 'Curriculum Plan', icon: Layers },
  { id: 7, name: 'Mux Video Setup', icon: Video },
  { id: 8, name: 'Assessments', icon: HelpCircle },
  { id: 9, name: 'Review & Audit', icon: Eye },
  { id: 10, name: 'Publish', icon: Rocket },
];

export default function CourseCreationWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    full_description: '',
    language: 'English',
    difficulty_level: 'intermediate',
    thumbnail_url: '/placeholders/course-placeholder.svg',
    preview_video_url: '',
    preview_mux_playback_id: '',
    initial_lesson_video_asset_id: '',
    selected_branches: ['CSE', 'AIML', 'IT'],
    category_id: 'c6',
    primary_instructor_id: 'u2',
    price: 3499,
    discount_price: 2499,
    is_subscription_eligible: true,
    access_duration_days: 365,
    initial_section_title: 'Module 1: Foundations and Architectural Deep Dive',
    initial_lesson_title: '1.1 Engineering Overview & Prerequisites',
    has_quizzes: true,
    has_assignments: true,
    status: 'draft',
  });

  function updateField(key: string, value: any) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function toggleBranch(code: string) {
    const branches = formData.selected_branches.includes(code)
      ? formData.selected_branches.filter((b) => b !== code)
      : [...formData.selected_branches, code];
    updateField('selected_branches', branches);
  }

  async function handleFinalSubmit(publishImmediately: boolean = false) {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        video: formData.initial_lesson_video_asset_id ? {
          mux_asset_id: formData.initial_lesson_video_asset_id,
          mux_playback_id: formData.preview_mux_playback_id,
        } : undefined,
        status: publishImmediately ? 'published' : 'draft',
      };

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        router.push('/admin/courses');
      } else {
        alert(json.error || 'Failed to create course');
      }
    } catch (err) {
      console.error('Error saving course:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              New Engineering Course Creation Wizard
            </h1>
            <p className="text-xs text-slate-500">
              Step {currentStep} of 10: {WIZARD_STEPS[currentStep - 1].name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFinalSubmit(false)}
            disabled={saving || !formData.title}
          >
            Save Draft
          </Button>
        </div>
      </div>

      {/* 10-Step Progress Stepper Ribbon */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
        {WIZARD_STEPS.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
                isCurrent
                  ? 'bg-[#0B3473] text-white shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1">
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="text-[10px] font-bold">{step.id}</span>
              </div>
              <span className="text-[9px] font-semibold truncate max-w-full mt-0.5">
                {step.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Wizard Content Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8">
          {/* STEP 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 1: Course Title & Core Metadata</h2>
              <div>
                <Label>Course Title *</Label>
                <Input
                  placeholder="e.g. Full Stack Next.js & React Enterprise Masterclass"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Short Description (Displays on catalog cards)</Label>
                <Input
                  placeholder="1-2 sentence executive overview"
                  value={formData.short_description}
                  onChange={(e) => updateField('short_description', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Full Description & Syllabus Overview</Label>
                <Textarea
                  placeholder="Detailed course scope, learning objectives and target career outcomes"
                  value={formData.full_description}
                  onChange={(e) => updateField('full_description', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty Level</Label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => updateField('difficulty_level', e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all_levels">All Levels</option>
                  </select>
                </div>
                <div>
                  <Label>Instruction Language</Label>
                  <Input
                    value={formData.language}
                    onChange={(e) => updateField('language', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Promotional Media */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 2: Course Thumbnail & Media</h2>
                <p className="text-xs text-slate-500">
                  Upload visual assets for your course card, banner, and public syllabus preview.
                </p>
              </div>

              <FileUpload
                accept="image/*"
                folder="thumbnails"
                label="Course Thumbnail Image"
                description="High-resolution banner (16:9 recommended, max 25MB) saved directly to secure storage"
                value={formData.thumbnail_url}
                onChange={(url) => updateField('thumbnail_url', url)}
              />

              <div className="pt-2 border-t border-slate-100">
                <VideoUploader
                  label="Promotional Trailer / Preview Video (Mux)"
                  playbackId={formData.preview_mux_playback_id || ''}
                  onVideoSelected={({ playbackId, assetId }) => {
                    updateField('preview_mux_playback_id', playbackId);
                    if (assetId) updateField('initial_lesson_video_asset_id', assetId);
                    updateField('preview_video_url', `https://stream.mux.com/${playbackId}.m3u8`);
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Branch Mapping */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 3: Academic Branch Mapping</h2>
              <p className="text-xs text-slate-500">
                Select the target academic branches permitted to access or recommended this course.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { code: 'CSE', label: 'Computer Science' },
                  { code: 'AIML', label: 'AI & Machine Learning' },
                  { code: 'ECE', label: 'Electronics & Comm' },
                  { code: 'EEE', label: 'Electrical & Electronics' },
                  { code: 'IT', label: 'Information Tech' },
                  { code: 'MECH', label: 'Mechanical' },
                  { code: 'CIVIL', label: 'Civil' },
                  { code: 'BCA', label: 'BCA' },
                  { code: 'MCA', label: 'MCA' },
                ].map((b) => {
                  const selected = formData.selected_branches.includes(b.code);
                  return (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => toggleBranch(b.code)}
                      className={`p-3 rounded-lg border text-left text-xs transition-all ${
                        selected
                          ? 'border-[#0B3473] bg-[#0B3473]/5 font-bold text-[#0B3473]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-mono text-sm">{b.code}</div>
                      <div className="text-[11px] text-slate-500">{b.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Category & Faculty */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 4: Category & Primary Faculty</h2>
              <div>
                <Label>Course Category</Label>
                <select
                  value={formData.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="c6">Next.js</option>
                  <option value="c8">Artificial Intelligence</option>
                  <option value="c4">Full Stack Development</option>
                  <option value="c14">VLSI</option>
                  <option value="c12">DevOps</option>
                  <option value="c2">Python</option>
                  <option value="c13">Embedded Systems</option>
                </select>
              </div>
              <div>
                <Label>Primary Instructor</Label>
                <select
                  value={formData.primary_instructor_id}
                  onChange={(e) => updateField('primary_instructor_id', e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="u2">Prof. Ananya Iyer (IIT Madras Fellow - Systems & Cloud)</option>
                  <option value="u3">Vikram Singh (Principal AI Engineer)</option>
                  <option value="u1">Dr. Rajesh Sharma (Platform Director)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: Pricing & Subscription Eligibility */}
          {currentStep === 5 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 5: Pricing & Subscription Eligibility</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Individual Purchase Price (INR)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField('price', Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Discount Price (Optional)</Label>
                  <Input
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => updateField('discount_price', Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Subscription Pass Eligibility</p>
                  <p className="text-[11px] text-slate-500">Allow active Monthly, Quarterly & Annual Pass holders full access</p>
                </div>
                <Switch
                  checked={formData.is_subscription_eligible}
                  onCheckedChange={(val) => updateField('is_subscription_eligible', val)}
                />
              </div>
            </div>
          )}

          {/* STEP 6: Curriculum Plan */}
          {currentStep === 6 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 6: Initial Curriculum Structure</h2>
              <div>
                <Label>Module 1 Title</Label>
                <Input
                  value={formData.initial_section_title}
                  onChange={(e) => updateField('initial_section_title', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Lesson 1 Title</Label>
                <Input
                  value={formData.initial_lesson_title}
                  onChange={(e) => updateField('initial_lesson_title', e.target.value)}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-slate-500">
                Additional sections, quizzes, and downloadable resources can be added using the Curriculum Manager once the course is saved.
              </p>
            </div>
          )}

          {/* STEP 7: Mux Video Setup */}
          {currentStep === 7 && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 7: Mux Direct Video Pipeline</h2>
                <p className="text-xs text-slate-500">
                  Upload your course preview / Lesson 1 video directly to Mux infrastructure. All student streaming uses signed tokens with watermarked enterprise playback.
                </p>
              </div>

              <VideoUploader
                label="Initial Lesson / Core Curriculum Video Asset"
                playbackId={formData.preview_mux_playback_id || ''}
                assetId={formData.initial_lesson_video_asset_id || ''}
                onVideoSelected={({ playbackId, assetId }) => {
                  updateField('preview_mux_playback_id', playbackId);
                  if (assetId) updateField('initial_lesson_video_asset_id', assetId);
                  updateField('preview_video_url', `https://stream.mux.com/${playbackId}.m3u8`);
                }}
              />

              <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-700" />
                  Mux Enterprise Integration Active
                </p>
                <p className="text-[11px] text-blue-700">
                  Videos upload directly from your browser to Mux's ingest API. When uploaded, Mux automatically creates 1080p multi-bitrate HLS renditions, waveform audio, and instant thumbnail frames.
                </p>
              </div>
            </div>
          )}

          {/* STEP 8: Assessments */}
          {currentStep === 8 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 8: Quizzes & Capstone Assignments</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Module Quizzes & Auto-Graded Assessments</p>
                    <p className="text-[11px] text-slate-500">Require 70% passing threshold for course completion</p>
                  </div>
                  <Switch
                    checked={formData.has_quizzes}
                    onCheckedChange={(v) => updateField('has_quizzes', v)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Instructor-Graded Capstone Assignment</p>
                    <p className="text-[11px] text-slate-500">GitHub repo & production deployment URL submission</p>
                  </div>
                  <Switch
                    checked={formData.has_assignments}
                    onCheckedChange={(v) => updateField('has_assignments', v)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Review & Audit */}
          {currentStep === 9 && (
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-lg font-bold text-slate-900">Step 9: Review & Audit Verification</h2>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Title:</span>
                  <span className="font-bold text-slate-900">{formData.title || '(Untitled)'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Retail Price:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(formData.price)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Target Branches:</span>
                  <span className="font-bold text-[#0B3473]">{formData.selected_branches.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subscription Included:</span>
                  <span className="font-bold text-emerald-700">{formData.is_subscription_eligible ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Publish */}
          {currentStep === 10 && (
            <div className="space-y-6 max-w-2xl text-center py-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Rocket className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Course Setup Completed</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  You can publish this course live to the SARVONAYA catalog now or save it as a draft to upload additional lessons and resources first.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={saving}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleFinalSubmit(true)}
                  disabled={saving || !formData.title}
                  className="bg-[#0B3473] hover:bg-[#082654]"
                >
                  {saving ? 'Publishing...' : 'Publish Course Live'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Wizard Footer Navigation */}
        <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Previous
          </Button>

          {currentStep < 10 ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 10))}
              disabled={currentStep === 1 && !formData.title}
              className="bg-[#0B3473] hover:bg-[#082654]"
            >
              Next Step
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleFinalSubmit(true)}
              disabled={saving || !formData.title}
              className="bg-[#0B3473] hover:bg-[#082654]"
            >
              Finish & Publish
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

