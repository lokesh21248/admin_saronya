import React, { Suspense } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';

export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F7FB]">
      {/* Collapsible Left Navigation Sidebar wrapped in Suspense for usePathname */}
      <Suspense fallback={<div className="w-64 bg-white border-r border-slate-200" />}>
        <Sidebar />
      </Suspense>

      {/* Main Admin Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Top Header with Breadcrumbs & Profile */}
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Header />
        </Suspense>

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading module...</div>}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
