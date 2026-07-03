'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';

interface ListResponse {
  total: number;
}

export default function DashboardPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const [contactsTotal, setContactsTotal] = useState<number | null>(null);
  const [callsTotal, setCallsTotal] = useState<number | null>(null);
  const [completedCalls, setCompletedCalls] = useState<number | null>(null);

  useEffect(() => {
    if (!orgId) return;

    Promise.all([
      apiAuthGet<ListResponse>(`/contacts?organizationId=${orgId}&page=1&size=1`),
      apiAuthGet<ListResponse>(`/calls?organizationId=${orgId}&page=1&size=1`),
      apiAuthGet<{ items: { status: string }[] }>(`/calls?organizationId=${orgId}&page=1&size=100`),
    ])
      .then(([contacts, calls, allCalls]) => {
        setContactsTotal(contacts.total);
        setCallsTotal(calls.total);
        setCompletedCalls(allCalls.items.filter((c) => c.status === 'COMPLETED').length);
      })
      .catch(() => {
        setContactsTotal(null);
        setCallsTotal(null);
        setCompletedCalls(null);
      });
  }, [orgId]);

  return (
    <RequireAuth>
      <div>
        <h1 className="text-2xl font-semibold">{ru.dashboard.title}</h1>
        <p className="mt-2 text-slate-400">{ru.dashboard.welcome(user?.name ?? ru.common.name)}</p>
        {!orgId && (
          <p className="mt-4 rounded-md bg-amber-950/40 px-3 py-2 text-sm text-amber-300">{ru.dashboard.noOrgInvite}</p>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/contacts" className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700">
            <div className="text-sm text-slate-500">{ru.dashboard.contacts}</div>
            <div className="mt-2 text-2xl font-semibold">{contactsTotal ?? '—'}</div>
          </Link>
          <Link href="/dashboard/calls" className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700">
            <div className="text-sm text-slate-500">{ru.dashboard.calls}</div>
            <div className="mt-2 text-2xl font-semibold">{callsTotal ?? '—'}</div>
          </Link>
          <Link href="/dashboard/team" className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-slate-700">
            <div className="text-sm text-slate-500">{ru.dashboard.team}</div>
            <div className="mt-2 text-sm text-slate-400">{ru.dashboard.inviteMembers}</div>
          </Link>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="text-sm text-slate-500">{ru.dashboard.completedCalls}</div>
            <div className="mt-2 text-2xl font-semibold">{completedCalls ?? '—'}</div>
            <div className="mt-1 text-xs text-slate-500">{ru.dashboard.aiSummaryNext}</div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
