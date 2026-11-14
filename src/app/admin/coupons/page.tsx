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
  BadgePercent,
  Plus,
  Tag,
  Calendar,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function CouponsManagementPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('20');
  const [minOrder, setMinOrder] = useState('1999');
  const [maxUses, setMaxUses] = useState('250');
  const [submitting, setSubmitting] = useState(false);

  async function loadCoupons() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons');
      const json = await res.json();
      if (json.success) {
        setCoupons(json.data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          description,
          discount_type: discountType,
          discount_value: discountValue,
          min_order_amount: minOrder,
          max_uses: maxUses,
        }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setCode('');
        setDescription('');
        loadCoupons();
      }
    } catch (err) {
      console.error('Failed to create coupon:', err);
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
            Promotional Coupons & Discounts
          </h1>
          <p className="text-sm text-slate-500">
            Configure server-side validated promo codes, academic branch vouchers, and seasonal discounts.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="gap-2 bg-[#0B3473] hover:bg-[#082654]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Coupon Code</span>
        </Button>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Promo Code</th>
                  <th className="px-6 py-3.5">Discount Benefit</th>
                  <th className="px-6 py-3.5">Min Order</th>
                  <th className="px-4 py-3.5">Redemption Usage</th>
                  <th className="px-4 py-3.5">Expiry Window</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading promotional coupons...
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-[#0B3473]/10 text-[#0B3473] border border-[#0B3473]/20">
                          {c.code}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs">{c.description}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 text-xs">
                        {c.discount_type === 'percentage'
                          ? `${c.discount_value}% OFF`
                          : `${formatCurrency(c.discount_value)} FLAT OFF`}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {formatCurrency(c.min_order_amount || 0)}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                        {c.used_count} / {c.max_uses || '∞'} used
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {c.expiry_date ? formatDateTime(c.expiry_date) : 'No expiration'}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Coupon Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Promotional Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
            <div>
              <Label>Coupon Code (e.g. SARVONAYA30)</Label>
              <Input
                placeholder="PROMOCODE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="mt-1 font-mono uppercase text-xs"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="e.g. 30% discount for IEEE student members"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <select
                  value={discountType}
                  onChange={(e: any) => setDiscountType(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Rupee (₹)</option>
                </select>
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order Amount (INR)</Label>
                <Input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label>Total Usage Limit</Label>
                <Input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

