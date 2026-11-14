'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-[#0B3473] transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Admin</span>
      </Link>
      {segments.slice(1).map((seg, idx) => {
        const href = `/${segments.slice(0, idx + 2).join('/')}`;
        const isLast = idx === segments.length - 2;
        const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{formatted}</span>
            ) : (
              <Link href={href} className="hover:text-[#0B3473] transition-colors">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

