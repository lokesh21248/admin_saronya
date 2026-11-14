'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/utils';
import {
  Settings,
  Palette,
  CreditCard,
  BookOpen,
  ShieldCheck,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settRes, auditRes] = await Promise.all([
          fetch('/api/admin/settings'),
          fetch('/api/admin/audit-logs'),
        ]);
        const settJson = await settRes.json();
        const auditJson = await auditRes.json();

        if (settJson.success) setSettings(settJson.data);
        if (auditJson.success) setAuditLogs(auditJson.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleSaveSettings(category: string, patch: any) {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, settings: patch }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Settings & Administration
          </h1>
          <p className="text-sm text-slate-500">
            Configure system parameters, branding colors, payment gateways, learning thresholds and security policies.
          </p>
        </div>
        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Learning Rules</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Security & Audit</span>
          </TabsTrigger>
        </TabsList>

        {/* GENERAL SETTINGS */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">General Platform Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div>
                <Label>Platform Name</Label>
                <Input
                  value={settings.general.platform_name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, platform_name: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Official Contact Email</Label>
                <Input
                  value={settings.general.contact_email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, contact_email: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Support Hotline Phone</Label>
                <Input
                  value={settings.general.support_phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, support_phone: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4">
              <Button onClick={() => handleSaveSettings('general', settings.general)} className="bg-[#0B3473]">
                <Save className="h-4 w-4 mr-1.5" />
                <span>Save General Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* BRANDING */}
        <TabsContent value="branding" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">SARVONAYA Visual Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="h-8 w-full rounded bg-[#0B3473] mb-2" />
                  <p className="text-[11px] font-bold text-slate-900">Primary Navy</p>
                  <p className="text-[10px] font-mono text-slate-500">#0B3473</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="h-8 w-full rounded bg-[#1455A0] mb-2" />
                  <p className="text-[11px] font-bold text-slate-900">Secondary Blue</p>
                  <p className="text-[10px] font-mono text-slate-500">#1455A0</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200">
                  <div className="h-8 w-full rounded bg-[#F5BD24] mb-2" />
                  <p className="text-[11px] font-bold text-slate-900">Gold Accent</p>
                  <p className="text-[10px] font-mono text-slate-500">#F5BD24</p>
                </div>
              </div>
              <div>
                <Label>Brand Tagline</Label>
                <Input
                  value={settings.branding.tagline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      branding: { ...settings.branding, tagline: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4">
              <Button onClick={() => handleSaveSettings('branding', settings.branding)} className="bg-[#0B3473]">
                <Save className="h-4 w-4 mr-1.5" />
                <span>Save Brand Colors</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* PAYMENTS */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Razorpay & Commerce Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Base Currency</Label>
                  <Input value={settings.payments.currency} disabled className="mt-1 bg-slate-100" />
                </div>
                <div>
                  <Label>Tax Calculation (GST %)</Label>
                  <Input
                    type="number"
                    value={settings.payments.tax_percentage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payments: { ...settings.payments, tax_percentage: Number(e.target.value) },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Razorpay Test Mode</p>
                  <p className="text-[11px] text-slate-500">Use rzp_test keys for simulated checkout payments</p>
                </div>
                <Switch
                  checked={settings.payments.razorpay_test_mode}
                  onCheckedChange={(val) =>
                    setSettings({
                      ...settings,
                      payments: { ...settings.payments, razorpay_test_mode: val },
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4">
              <Button onClick={() => handleSaveSettings('payments', settings.payments)} className="bg-[#0B3473]">
                <Save className="h-4 w-4 mr-1.5" />
                <span>Save Payment Settings</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* LEARNING RULES */}
        <TabsContent value="learning" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Learning Completion & Certification Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Video Watch Progress (%)</Label>
                  <Input
                    type="number"
                    value={settings.learning.min_video_completion_pct}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        learning: { ...settings.learning, min_video_completion_pct: Number(e.target.value) },
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Min Quiz Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={settings.learning.quiz_pass_pct}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        learning: { ...settings.learning, quiz_pass_pct: Number(e.target.value) },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Dynamic Learner Watermarking</p>
                  <p className="text-[11px] text-slate-500">Overlay student email dynamically on Mux playback to prevent pirating</p>
                </div>
                <Switch
                  checked={settings.learning.enable_watermarking}
                  onCheckedChange={(val) =>
                    setSettings({
                      ...settings,
                      learning: { ...settings.learning, enable_watermarking: val },
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4">
              <Button onClick={() => handleSaveSettings('learning', settings.learning)} className="bg-[#0B3473]">
                <Save className="h-4 w-4 mr-1.5" />
                <span>Save Learning Rules</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SECURITY & AUDIT TRAIL */}
        <TabsContent value="security" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0B3473]" />
                <span>Immutable Security Audit Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Action Event</th>
                      <th className="px-6 py-3.5">Administrator</th>
                      <th className="px-4 py-3.5">Entity</th>
                      <th className="px-4 py-3.5">Payload Details</th>
                      <th className="px-6 py-3.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 font-bold text-xs text-[#0B3473]">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700">
                          {log.actor_email || 'System'}
                        </td>
                        <td className="px-4 py-4 text-xs font-mono text-slate-500">
                          {log.entity_type} ({log.entity_id || 'global'})
                        </td>
                        <td className="px-4 py-4 text-[11px] text-slate-500 max-w-xs truncate font-mono">
                          {JSON.stringify(log.details)}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-400">
                          {formatDateTime(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

