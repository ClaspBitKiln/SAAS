'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';

type FollowUpFilter = 'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING';

interface RequestItem {
  id: string;
  title: string | null;
  status: string;
  source: string;
  lines: { rawLine?: string | null; steelGrade?: string | null }[];
  profitAmount: number;
  currency: string;
  proposalNumber: string | null;
  proposalSentAt: string | null;
  proposalSentVia: string | null;
  followUpAt: string | null;
  outcome: 'WON' | 'LOST' | 'NO_RESPONSE' | null;
  outcomeReason: string | null;
  createdAt: string;
}

interface RequestList {
  items: RequestItem[];
  total: number;
}

function followUpBucket(
  followUpAt: string | null,
  outcome: RequestItem['outcome'],
): Exclude<FollowUpFilter, 'ALL'> | null {
  if (!followUpAt || outcome) return null;

  const followUp = new Date(followUpAt);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (followUp < now) return 'OVERDUE';
  if (followUp < tomorrow) return 'TODAY';
  return 'UPCOMING';
}

export default function RequestsPage() {
  const orgId = getAuthUser()?.organizationId;
  const [items, setItems] = useState<RequestItem[]>([]);
  const [filter, setFilter] = useState<FollowUpFilter>('ALL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    apiAuthGet<RequestList>(`/requests?organizationId=${orgId}&size=100`)
      .then((data) => setItems(data.items))
      .catch(() => setError(ru.requests.loadError));
  }, [orgId]);

  const followUpCounts = items.reduce(
    (counts, item) => {
      const bucket = followUpBucket(item.followUpAt, item.outcome);
      if (bucket) counts[bucket] += 1;
      return counts;
    },
    { OVERDUE: 0, TODAY: 0, UPCOMING: 0 },
  );

  const visibleItems = items
    .filter((item) => filter === 'ALL' || followUpBucket(item.followUpAt, item.outcome) === filter)
    .sort((left, right) => {
      if (!left.followUpAt) return 1;
      if (!right.followUpAt) return -1;
      return new Date(left.followUpAt).getTime() - new Date(right.followUpAt).getTime();
    });

  const filters: { value: FollowUpFilter; label: string; count: number }[] = [
    { value: 'ALL', label: ru.requests.followUpAll, count: items.length },
    { value: 'OVERDUE', label: ru.requests.followUpOverdue, count: followUpCounts.OVERDUE },
    { value: 'TODAY', label: ru.requests.followUpToday, count: followUpCounts.TODAY },
    { value: 'UPCOMING', label: ru.requests.followUpUpcoming, count: followUpCounts.UPCOMING },
  ];

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{ru.requests.title}</h1>
            <p className="mt-2 text-slate-400">{ru.requests.subtitle}</p>
          </div>
          <Link
            href="/dashboard/requests/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            {ru.requests.new}
          </Link>
        </div>
        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-2" aria-label={ru.requests.followUpFilters}>
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={`rounded-md border px-3 py-2 text-sm transition ${
                filter === item.value
                  ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {item.label} <span className="ml-1 tabular-nums">{item.count}</span>
            </button>
          ))}
        </div>
        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {visibleItems.length === 0 && !error && (
            <li className="px-4 py-6 text-sm text-slate-500">
              {filter === 'ALL' ? ru.requests.empty : ru.requests.followUpEmpty}
            </li>
          )}
          {visibleItems.map((r) => {
            const bucket = followUpBucket(r.followUpAt, r.outcome);
            const followUpClass =
              bucket === 'OVERDUE'
                ? 'text-red-400'
                : bucket === 'TODAY'
                  ? 'text-amber-400'
                  : 'text-sky-400';

            return (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <div className="font-medium">{r.title ?? ru.requests.untitled}</div>
                  <div className="text-sm text-slate-500">
                    {ru.requests.lines(r.lines.length)} · {ru.requests.sourceLabel(r.source)} ·{' '}
                    {r.status === 'SENT'
                      ? ru.requests.sent
                      : r.status === 'QUOTED'
                        ? ru.requests.quoted
                        : r.status}
                  </div>
                  {['QUOTED', 'SENT'].includes(r.status) && (
                    <div className="mt-1 text-xs text-emerald-400">
                      {r.proposalNumber} · {ru.requests.profit}:{' '}
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: r.currency,
                        maximumFractionDigits: 2,
                      }).format(r.profitAmount)}
                      {r.proposalSentAt
                        ? ` · ${ru.requests.sentAt(
                            new Intl.DateTimeFormat('ru-RU').format(new Date(r.proposalSentAt)),
                            ru.requests.sentViaLabel(r.proposalSentVia ?? '—'),
                          )}`
                        : ''}
                    </div>
                  )}
                  {r.outcome ? (
                    <div className="mt-1 text-xs font-medium text-emerald-300">
                      {ru.requests.outcomeLabel(r.outcome)} · {r.outcomeReason}
                    </div>
                  ) : r.followUpAt ? (
                    <div className={`mt-1 text-xs font-medium ${followUpClass}`}>
                      {bucket === 'OVERDUE'
                        ? ru.requests.followUpOverdueAt(
                            new Intl.DateTimeFormat('ru-RU', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(new Date(r.followUpAt)),
                          )
                        : bucket === 'TODAY'
                          ? ru.requests.followUpTodayAt(
                              new Intl.DateTimeFormat('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(r.followUpAt)),
                            )
                          : ru.requests.followUpUpcomingAt(
                              new Intl.DateTimeFormat('ru-RU', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              }).format(new Date(r.followUpAt)),
                            )}
                    </div>
                  ) : null}
                </div>
                <Link
                  href={`/dashboard/requests/${r.id}`}
                  className="shrink-0 rounded-md border border-blue-500/50 px-3 py-1.5 text-sm text-blue-300 hover:bg-blue-500/10"
                >
                  {bucket === 'OVERDUE' || bucket === 'TODAY'
                    ? ru.requests.followUpAction
                    : ru.common.open}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </RequireAuth>
  );
}
