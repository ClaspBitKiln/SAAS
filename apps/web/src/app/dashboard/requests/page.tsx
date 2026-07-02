'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';

interface RequestItem {
  id: string;
  title: string | null;
  status: string;
  source: string;
  lines: { rawLine?: string | null; steelGrade?: string | null }[];
  createdAt: string;
}

interface RequestList {
  items: RequestItem[];
  total: number;
}

export default function RequestsPage() {
  const orgId = getAuthUser()?.organizationId;
  const [items, setItems] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    apiAuthGet<RequestList>(`/requests?organizationId=${orgId}`)
      .then((data) => setItems(data.items))
      .catch(() => setError('Could not load requests'));
  }, [orgId]);

  return (
    <RequireAuth>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Requests</h1>
            <p className="mt-2 text-slate-400">Metal procurement requests (заявки).</p>
          </div>
          <Link
            href="/dashboard/requests/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            New request
          </Link>
        </div>
        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {items.length === 0 && !error && (
            <li className="px-4 py-6 text-sm text-slate-500">No requests yet.</li>
          )}
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{r.title ?? 'Untitled request'}</div>
                <div className="text-sm text-slate-500">
                  {r.lines.length} lines · {r.source} · {r.status}
                </div>
              </div>
              <Link href={`/dashboard/requests/${r.id}`} className="text-sm text-blue-400 hover:underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
