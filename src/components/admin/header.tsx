'use client';

import React, { useState } from 'react';
import { Breadcrumbs } from './breadcrumbs';
import { useAdminUI } from './admin-context';
import {
  Bell,
  Search,
  ExternalLink,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { toggleMobileNav } = useAdminUI();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 md:px-6 backdrop-blur-md">
      {/* Left side: Hamburger on mobile + Breadcrumb Trail */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Right side: Global Search, Quick Links & Admin Identity */}
      <div className="flex items-center gap-3">
        {/* Global Admin Search */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, courses, payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0B3473] focus:outline-none focus:ring-1 focus:ring-[#0B3473]"
          />
        </div>

        {/* Live Portal Shortcut */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B3473] hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Student Portal</span>
        </a>

        {/* Notifications Icon with Indicator */}
        <Link
          href="/admin/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-[#0B3473] hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#F5BD24] ring-2 ring-white" />
        </Link>

        {/* Admin User Profile Capsule */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-1.5 pr-2.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0B3473] text-white text-xs font-bold">
              RS
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                Dr. Rajesh Sharma
              </span>
              <span className="text-[10px] font-semibold text-[#0B3473] uppercase tracking-wider">
                Super Admin
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">Dr. Rajesh Sharma</p>
                <p className="text-[11px] text-slate-500 truncate">admin@sarvonaya.edu</p>
                <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                  Full Super Admin Privilege
                </span>
              </div>
              <div className="py-1">
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Account & Settings</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Security & Audit Trail</span>
                </Link>
              </div>
              <div className="pt-1 border-t border-slate-100">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

