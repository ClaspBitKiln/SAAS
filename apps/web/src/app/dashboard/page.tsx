'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiGet } from '@/lib/api';
import { getAccessToken, getAuthUser } from '@/lib/auth';

interface ListResponse {
  total: number;
}

export default function DashboardPage() {
  const user = getAuthUser();
  const [contactsTotal, setContactsTotal] = useState<number | null>(null);
  const [callsTotal, setCallsTotal] = useState<number | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const orgId = user?.organizationId;
    if (!token || !orgId) return;

    Promise.all([
      apiGet<ListResponse>(`/contacts?organizationId=${orgId}&page=1&size=1`, token),
      apiGet<ListResponse>(`/calls?organizationId=${orgId}&page=1&size=1`, token),
    ])
      .then(([contacts, calls]) => {
        setContactsTotal(contacts.total);
        setCallsTotal(calls.total);
      })
      .catch(() => {
        setContactsTotal(null);
        setCallsTotal(null);
      });
  }, [user?.organizationId]);

  return (
    <RequireAuth>
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome back, {user?.name ?? 'User'}.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link href="/dashboard/contacts" className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700">
            <div className="text-sm text-slate-500">Contacts</div>
            <div className="mt-2 text-2xl font-semibold">{contactsTotal ?? '—'}</div>
          </Link>
          <Link href="/dashboard/calls" className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700">
            <div className="text-sm text-slate-500">Calls</div>
            <div className="mt-2 text-2xl font-semibold">{callsTotal ?? '—'}</div>
          </Link>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 opacity-60">
            <div className="text-sm text-slate-500">AI Summary</div>
            <div className="mt-2 text-sm text-slate-400">Coming soon</div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
