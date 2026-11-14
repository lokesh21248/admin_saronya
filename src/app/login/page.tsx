'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@sarvonaya.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/admin');
    }, 400);
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B3473] text-[#F5BD24] font-black text-2xl shadow-md">
            S
          </div>
          <h1 className="text-2xl font-black tracking-wider text-slate-900">
            SARVONAYA
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Administrative Portal Gateway
          </p>
        </div>

        <Card className="border border-slate-200 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 text-center">
              Sign In to Admin Workspace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Admin Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label>Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0B3473] shrink-0 mt-0.5" />
                <span>
                  Clerk Multi-Factor Authentication & RBAC role checks active.
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0B3473] hover:bg-[#082654] font-bold text-sm shadow-sm"
              >
                {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-400">
          SARVONAYA Enterprise Security System • Authorized personnel only
        </div>
      </div>
    </div>
  );
}

