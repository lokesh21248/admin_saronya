'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Download,
  Calendar,
  CreditCard,
  BookOpen,
  Users,
  Award,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function ReportsAndAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [revenueReport, setRevenueReport] = useState<any[]>([]);

  useEffect(() => {
    async function loadRevenue() {
      try {
        const res = await fetch('/api/admin/reports/revenue');
        const json = await res.json();
        if (json.success) {
          setRevenueReport(json.data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRevenue();
  }, []);

  function handleDownloadCsv() {
    window.open('/api/admin/reports/revenue?format=csv', '_blank');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Enterprise Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Exportable operational metrics, revenue breakdowns, branch registration velocity and completion statistics.
          </p>
        </div>
        <Button
          onClick={handleDownloadCsv}
          variant="outline"
          className="gap-2 border-slate-200"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV Report</span>
        </Button>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="revenue" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>Registrations</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Enrollments</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span>Completions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Monthly Revenue Streams (INR)
                </CardTitle>
                <p className="text-xs text-slate-500">Direct course sales vs subscription memberships</p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueReport}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickFormatter={(val) => `₹${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    />
                    <Legend />
                    <Bar dataKey="coursesRevenue" name="Individual Courses" fill="#0B3473" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="subscriptionsRevenue" name="Subscriptions" fill="#F5BD24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown Table */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Month</th>
                    <th className="px-6 py-3.5">Course Sales</th>
                    <th className="px-6 py-3.5">Subscription Sales</th>
                    <th className="px-6 py-3.5 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {revenueReport.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-xs text-slate-900">{row.month}</td>
                      <td className="px-6 py-4 text-xs text-slate-700">{formatCurrency(row.coursesRevenue)}</td>
                      <td className="px-6 py-4 text-xs text-slate-700">{formatCurrency(row.subscriptionsRevenue)}</td>
                      <td className="px-6 py-4 text-right font-bold text-xs text-emerald-700">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card className="p-8 text-center text-slate-500 text-sm">
            Select student cohort filters to export branch-wise enrollment demographics.
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <Card className="p-8 text-center text-slate-500 text-sm">
            Course enrollment and drop-off rate telemetry.
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card className="p-8 text-center text-slate-500 text-sm">
            Quiz score distributions and capstone assignment completion audit reports.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

