'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FolderTree,
  Video,
  UserCheck,
  CreditCard,
  Repeat,
  BadgePercent,
  HelpCircle,
  FileCheck2,
  FileText,
  Bell,
  BarChart3,
  LifeBuoy,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BookMarked,
  X,
} from 'lucide-react';
import { useAdminUI } from './admin-context';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: 'gold' | 'default';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { title: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Academic & Courses',
    items: [
      { title: 'Courses', href: '/admin/courses', icon: BookOpen },
      { title: 'Academic Branches', href: '/admin/branches', icon: GraduationCap },
      { title: 'Categories', href: '/admin/categories', icon: FolderTree },
      { title: 'Mux Video Library', href: '/admin/videos', icon: Video },
      { title: 'Instructors', href: '/admin/instructors', icon: UserCheck },
    ],
  },
  {
    label: 'Students & Learning',
    items: [
      { title: 'Students', href: '/admin/students', icon: Users },
      { title: 'Enrollments', href: '/admin/enrollments', icon: BookMarked },
      { title: 'Assessments (Quizzes)', href: '/admin/assessments', icon: HelpCircle },
      { title: 'Assignments', href: '/admin/assignments', icon: FileText },
      { title: 'Certificates', href: '/admin/certificates', icon: FileCheck2 },
    ],
  },
  {
    label: 'Commerce & Finance',
    items: [
      { title: 'Payments & Revenue', href: '/admin/payments', icon: CreditCard },
      { title: 'Subscriptions', href: '/admin/subscriptions', icon: Repeat },
      { title: 'Coupons & Discounts', href: '/admin/coupons', icon: BadgePercent },
    ],
  },
  {
    label: 'Operations & Settings',
    items: [
      { title: 'Notifications', href: '/admin/notifications', icon: Bell },
      { title: 'Student Support', href: '/admin/support', icon: LifeBuoy, badge: '2 Open' },
      { title: 'Platform Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileNavOpen, setMobileNavOpen } = useAdminUI();

  return (
    <>
      {/* Mobile Slide-Out Drawer Overlay (< lg) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 bg-[#0B3473]">
              <Link
                href="/admin"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2.5 overflow-hidden"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5BD24] text-[#0B3473] font-black text-xl shadow-xs">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-wider text-white">
                    SARVONAYA
                  </span>
                  <span className="text-[10px] font-semibold text-[#F5BD24] tracking-widest uppercase">
                    Admin Portal
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === '/admin'
                          ? pathname === '/admin'
                          : pathname.startsWith(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-[#0B3473] text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B3473]'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive
                                ? 'text-[#F5BD24]'
                                : 'text-slate-400 group-hover:text-[#0B3473]'
                            )}
                          />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-100 text-amber-800'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Footer Status */}
            <div className="m-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>RLS & RBAC Active</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Production security enforced. Multi-tenant access controls active.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (>= lg) */}
      <aside
        className={cn(
          'hidden lg:flex relative flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out shrink-0 select-none z-30',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 bg-[#0B3473]">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5BD24] text-[#0B3473] font-black text-xl shadow-xs">
              S
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-wider text-white">
                  SARVONAYA
                </span>
                <span className="text-[10px] font-semibold text-[#F5BD24] tracking-widest uppercase">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-[#0B3473] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B3473]'
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-[#F5BD24]'
                            : 'text-slate-400 group-hover:text-[#0B3473]'
                        )}
                      />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Security & Access Status Banner */}
        {!collapsed ? (
          <div className="m-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>RLS & RBAC Active</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Production security enforced. Multi-tenant access controls active.
            </p>
          </div>
        ) : (
          <div className="p-3 flex justify-center text-emerald-700" title="RLS & RBAC Active">
            <ShieldCheck className="h-5 w-5" />
          </div>
        )}
      </aside>
    </>
  );
}

