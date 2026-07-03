'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiAuthPost } from '@/lib/api';
import { ru } from '@/lib/ru';

interface Offer {
  supplierName: string;
  region?: string;
  price?: number;
  currency?: string;
  leadTimeDays?: number;
  inStock?: boolean;
}

interface RequestDetail {
  id: string;
  title: string | null;
  status: string;
  notes: string | null;
  lines: Array<{ rawLine?: string | null; steelGrade?: string | null; gost?: string | null; quantity?: string | null }>;
  searchResult?: { offers?: Offer[]; status?: string } | null;
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiAuthGet<RequestDetail>(`/requests/${id}`);
      setRequest(data);
    } catch {
      setError(ru.requests.notFound);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSearch() {
    setSearching(true);
    setError(null);
    try {
      const data = await apiAuthPost<RequestDetail>(`/requests/${id}/search`, {});
      setRequest(data);
    } catch {
      setError(ru.requests.searchFailed);
    } finally {
      setSearching(false);
    }
  }

  if (!request && !error) {
    return (
      <RequireAuth>
        <div className="text-slate-400">{ru.common.loading}</div>
      </RequireAuth>
    );
  }

  const offers = request?.searchResult?.offers ?? [];

  return (
    <RequireAuth>
      <div className="max-w-3xl">
        <Link href="/dashboard/requests" className="text-sm text-slate-400 hover:text-white">
          {ru.requests.back}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{request?.title ?? ru.requests.detailTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {ru.requests.status}: {request?.status}
        </p>
        {request?.notes && <p className="mt-4 text-sm text-slate-400">{request.notes}</p>}

        <h2 className="mt-8 text-sm font-medium text-slate-300">{ru.requests.positions}</h2>
        <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-800">
          {request?.lines.map((l, i) => (
            <li key={i} className="px-4 py-3 text-sm">
              <div className="font-medium">{l.rawLine ?? l.steelGrade ?? '—'}</div>
              <div className="text-slate-500">
                {[l.steelGrade, l.gost, l.quantity].filter(Boolean).join(' · ')}
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => void onSearch()}
          disabled={searching}
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm disabled:opacity-50"
        >
          {searching ? ru.requests.searching : ru.requests.searchEmetall}
        </button>

        {offers.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-medium text-slate-300">{ru.requests.offers}</h2>
            <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-800">
              {offers.map((o, i) => (
                <li key={i} className="px-4 py-3 text-sm">
                  <div className="font-medium">{o.supplierName}</div>
                  <div className="text-slate-500">
                    {o.price != null ? `${o.price} ${o.currency ?? 'RUB'}` : '—'}
                    {o.region ? ` · ${o.region}` : ''}
                    {o.inStock ? ` · ${ru.requests.inStock}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {request?.status === 'SEARCHED' && offers.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{ru.requests.searchDoneEmpty}</p>
        )}

        {error && <p className="mt-4 text-sm text-amber-400">{error}</p>}
      </div>
    </RequireAuth>
  );
}
