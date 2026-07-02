'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiGet, getApiBaseUrl } from '@/lib/api';
import { getAccessToken, getAuthUser } from '@/lib/auth';

interface Call {
  id: string;
  phone: string;
  direction: string;
  status: string;
}

interface CallList {
  items: Call[];
  total: number;
}

export default function CallsPage() {
  const user = getAuthUser();
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const orgId = user?.organizationId;
    if (!token || !orgId) {
      setError('No organization context.');
      return;
    }
    apiGet<CallList>(`/calls?organizationId=${orgId}`, token)
      .then((data) => setCalls(data.items))
      .catch(() => setError(`Could not load calls. API: ${getApiBaseUrl()}`));
  }, [user?.organizationId]);

  return (
    <RequireAuth>
      <div>
        <h1 className="text-2xl font-semibold">Calls</h1>
        <p className="mt-2 text-slate-400">Call history for your organization.</p>
        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
        <ul className="mt-6 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {calls.length === 0 && !error && <li className="px-4 py-6 text-sm text-slate-500">No calls yet.</li>}
          {calls.map((call) => (
            <li key={call.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{call.phone}</span>
              <span className="text-slate-500">
                {call.direction} · {call.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </RequireAuth>
  );
}
