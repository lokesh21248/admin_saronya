import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  BookOpen,
  GraduationCap,
  CreditCard,
  Video,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B3473] text-[#F5BD24] font-black text-xl shadow-xs">
            S
          </div>
          <span className="text-lg font-black tracking-wider text-[#0B3473]">
            SARVONAYA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button className="bg-[#0B3473] hover:bg-[#082654] gap-1.5 shadow-sm">
              <span>Open Admin Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0B3473] text-xs font-bold border border-blue-200">
            <Sparkles className="h-3.5 w-3.5 text-[#F5BD24]" />
            <span>Enterprise Online Education & Engineering Accreditation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            SARVONAYA Mission-Critical <br className="hidden sm:inline" />
            <span className="text-[#0B3473]">Enterprise Admin Portal</span>
          </h1>

          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Full-stack management system for higher education engineering curricula, academic branches (CSE, ECE, EEE, AIML, etc.), Mux signed video streaming, and server-side verified Razorpay commerce.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/admin">
              <Button size="lg" className="bg-[#0B3473] hover:bg-[#082654] text-white px-8 gap-2 font-bold shadow-md">
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/courses">
              <Button size="lg" variant="outline" className="border-slate-300 font-semibold">
                <span>Explore Course Catalog</span>
              </Button>
            </Link>
          </div>

          {/* Quick Feature Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <GraduationCap className="h-5 w-5 text-[#0B3473] mb-2" />
              <h4 className="font-bold text-xs text-slate-900">Academic Branches</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">CSE, ECE, IT, AIML mapping</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <Video className="h-5 w-5 text-[#0B3473] mb-2" />
              <h4 className="font-bold text-xs text-slate-900">Mux Video Pipeline</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Signed token streaming</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <CreditCard className="h-5 w-5 text-[#16A36A] mb-2" />
              <h4 className="font-bold text-xs text-slate-900">Razorpay Commerce</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified webhooks & passes</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-xs text-slate-900">RLS & RBAC Security</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Clerk auth & audit trails</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        © 2026 SARVONAYA EDUTECH PVT LTD. All rights reserved. Built with Next.js App Router, Supabase PostgreSQL, Mux & Razorpay.
      </footer>
    </div>
  );
}
