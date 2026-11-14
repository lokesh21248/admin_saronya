'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/admin/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Repeat,
  Plus,
  CheckCircle2,
  Calendar,
  Users,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export default function SubscriptionsManagementPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPlanModal, setCreatePlanModal] = useState(false);

  // New Plan form state
  const [name, setName] = useState('');
  const [interval, setInterval] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('1499');
  const [discountPrice, setDiscountPrice] = useState('999');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/subscriptions');
      const json = await res.json();
      if (json.success) {
        setPlans(json.plans);
        setSubscriptions(json.subscriptions);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          interval,
          duration_days: durationDays,
          price,
          discount_price: discountPrice,
          description,
        }),
      });
      if (res.ok) {
        setCreatePlanModal(false);
        setName('');
        setDescription('');
        loadData();
      }
    } catch (err) {
      console.error('Error creating plan:', err);
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
            Subscription Tier Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage recurring monthly, quarterly, and annual passes, Razorpay plan mappings and subscriber entitlements.
          </p>
        </div>
        <Button
          onClick={() => setCreatePlanModal(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Subscription Tier</span>
        </Button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card key={p.id} className="border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="uppercase text-[11px] font-bold text-[#0B3473] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {p.interval} Tier
                </span>
                <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
              </div>

              <div>
                <h3 className="font-bold text-lg text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
              </div>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(p.discount_price || p.price)}
                </span>
                {p.discount_price && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatCurrency(p.price)}
                  </span>
                )}
                <span className="text-xs text-slate-500">/ {p.duration_days} days</span>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                {(p.features || []).map((feat: string, fIdx: number) => (
                  <div key={fIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-xs flex items-center justify-between">
              <span className="text-slate-500">Active Subscribers:</span>
              <span className="font-bold text-[#0B3473]">{p.active_subscribers_count || 120} Students</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Subscribers Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0B3473]" />
            <span>Active Subscribers Ledger</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Plan Tier</th>
                  <th className="px-4 py-3.5">Razorpay Sub ID</th>
                  <th className="px-4 py-3.5">Period Window</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-xs text-slate-900">{sub.studentName}</p>
                      <p className="text-[11px] text-slate-400">{sub.studentEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-[#0B3473]">
                      {sub.planName}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">
                      {sub.razorpay_subscription_id || sub.id}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {formatDateTime(sub.current_period_start)} → {formatDateTime(sub.current_period_end)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={sub.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Plan Modal */}
      <Dialog open={createPlanModal} onOpenChange={setCreatePlanModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Subscription Pass Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlan} className="space-y-4 pt-2">
            <div>
              <Label>Plan Name</Label>
              <Input
                placeholder="e.g. Semi-Annual Engineering Pass"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Billing Interval</Label>
                <select
                  value={interval}
                  onChange={(e: any) => setInterval(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <Label>Duration (Days)</Label>
                <Input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Retail Price (INR)</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label>Discount Price (INR)</Label>
                <Input
                  type="number"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <div>
              <Label>Plan Description</Label>
              <Input
                placeholder="Short summary of tier benefits"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreatePlanModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Tier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

