'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { ru } from '@/lib/ru';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">{ru.common.loading}</div>;
  }

  return <AppShell>{children}</AppShell>;
}
