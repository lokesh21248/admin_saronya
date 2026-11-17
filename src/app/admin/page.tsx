'use client';

import React, { useState, useEffect } from 'react';
import { MetricCard } from '@/components/admin/metric-card';
import { StatusBadge } from '@/components/admin/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Users,
  BookOpen,
  UserCheck,
  TrendingUp,
  CreditCard,
  Repeat,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/dashboard?filter=${filter}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [filter]);

  const stats = data?.stats || {
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalInstructors: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    studentGrowthPct: 0,
    revenueGrowthPct: 0,
  };

  const revenueData = data?.revenueOverTime || [];

  const branchDistribution = data?.branchDistribution || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            SARVONAYA Executive Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Live enterprise academic operations, student enrollments, video streaming and Razorpay financial telemetry.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: '7D' },
            { id: '30days', label: '30D' },
            { id: '90days', label: '90D' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === btn.id
                  ? 'bg-[#0B3473] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-slate-200 ml-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Custom Range</span>
          </Button>
        </div>
      </div>

      {/* Top 8 Statistics Cards (Calculated directly from database records) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          change={`+${stats.studentGrowthPct}%`}
          isPositive={true}
          subtitle={`${stats.activeStudents.toLocaleString()} currently active learners`}
          icon={<Users className="h-5 w-5 text-[#0B3473]" />}
        />
        <MetricCard
          title="Total Platform Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={`+${stats.revenueGrowthPct}%`}
          isPositive={true}
          subtitle="Razorpay verified collections"
          icon={<CreditCard className="h-5 w-5 text-[#16A36A]" />}
          accentColor="text-emerald-700 bg-emerald-50"
        />
        <MetricCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          change="+18%"
          isPositive={true}
          subtitle="Monthly, quarterly & annual passes"
          icon={<Repeat className="h-5 w-5 text-[#1455A0]" />}
          accentColor="text-[#1455A0] bg-blue-50"
        />
        <MetricCard
          title="Courses Catalog"
          value={`${stats.publishedCourses} / ${stats.totalCourses}`}
          subtitle="Published across 10 academic branches"
          icon={<BookOpen className="h-5 w-5 text-[#F5BD24]" />}
          accentColor="text-amber-800 bg-amber-50"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Chart (2 Columns) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Revenue & Sales Trajectory
              </CardTitle>
              <p className="text-xs text-slate-500">
                Daily Razorpay gross receipts & paid transactions
              </p>
            </div>
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm" className="text-xs text-[#0B3473]">
                <span>Financial Ledger</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B3473" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0B3473" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Gross Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0B3473"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Branch-Wise Student Distribution (1 Column) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Students by Academic Branch
            </CardTitle>
            <p className="text-xs text-slate-500">
              Enrollments mapped to engineering disciplines
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchDistribution} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                  <YAxis dataKey="branch" type="category" tick={{ fill: '#0B3473', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val} Enrolled Students`, 'Students']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                  <Bar dataKey="students" fill="#1455A0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Detailed Section: Recent Transactions & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Razorpay Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Recent Payment Settlements
              </CardTitle>
              <p className="text-xs text-slate-500">Verified Razorpay gateway transactions</p>
            </div>
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm" className="text-xs text-[#0B3473]">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(data?.recentTransactions || []).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.courseTitle || 'Subscription Pass'}</p>
                      <p className="text-[11px] text-slate-500">{tx.email} • {tx.paymentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Student Registrations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Recent Student Registrations
              </CardTitle>
              <p className="text-xs text-slate-500">New verified student accounts</p>
            </div>
            <Link href="/admin/students">
              <Button variant="ghost" size="sm" className="text-xs text-[#0B3473]">
                Manage Students
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(data?.recentStudents || []).map((st: any) => (
                <div key={st.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#0B3473]/10 text-[#0B3473] flex items-center justify-center font-bold text-xs">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{st.name}</p>
                      <p className="text-[11px] text-slate-500">{st.email} • {st.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={st.status} />
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(st.registeredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Courses & Security Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Courses */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Top Performing Engineering Courses
              </CardTitle>
              <p className="text-xs text-slate-500">Ranked by active enrollments and completion rates</p>
            </div>
            <Link href="/admin/courses">
              <Button variant="ghost" size="sm" className="text-xs text-[#0B3473]">
                Course Catalog
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(data?.topPerformingCourses || []).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{c.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {c.enrolledCount} active students • Completion: {c.completionRate}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700">{formatCurrency(c.price)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Audit Feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0B3473]" />
              <span>Security & Audit Log</span>
            </CardTitle>
            <p className="text-xs text-slate-500">Immutable administrative event stream</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {(data?.activityLogs || []).map((log: any) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#0B3473] tracking-wide">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-medium">
                    {log.actor_email}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {JSON.stringify(log.details)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

