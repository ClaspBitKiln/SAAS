'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

interface RequestLine {
  id: string;
  rawLine?: string | null;
  steelGrade?: string | null;
  gost?: string | null;
  quantity?: string | null;
  unit?: string | null;
  purchaseAmount?: number | null;
  saleAmount?: number | null;
}

interface RequestDetail {
  id: string;
  contactId: string | null;
  title: string | null;
  status: string;
  notes: string | null;
  currency: string;
  sellerName: string | null;
  deliveryTerms: string | null;
  logisticsCost: number;
  otherCosts: number;
  purchaseTotal: number;
  saleTotal: number;
  profitAmount: number;
  marginPercent: number;
  proposalNumber: string | null;
  proposalValidityDays: number;
  followUpAt: string | null;
  lines: RequestLine[];
  searchResult?: { offers?: Offer[]; status?: string } | null;
}

interface CommercialLine {
  purchaseAmount: string;
  saleAmount: string;
}

function defaultFollowUp(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalDateTime(value: string | null): string {
  if (!value) return defaultFollowUp();
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function numberValue(value: string): number {
  const parsed = Number(value.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [commercials, setCommercials] = useState<Record<string, CommercialLine>>({});
  const [currency, setCurrency] = useState('RUB');
  const [sellerName, setSellerName] = useState('ООО «Мэджик Металл»');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [logisticsCost, setLogisticsCost] = useState('0');
  const [otherCosts, setOtherCosts] = useState('0');
  const [validityDays, setValidityDays] = useState('5');
  const [followUpAt, setFollowUpAt] = useState(defaultFollowUp());
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);

  const applyRequest = useCallback((data: RequestDetail) => {
    setRequest(data);
    setCurrency(data.currency || 'RUB');
    setSellerName(data.sellerName || 'ООО «Мэджик Металл»');
    setDeliveryTerms(data.deliveryTerms || '');
    setLogisticsCost(String(data.logisticsCost ?? 0));
    setOtherCosts(String(data.otherCosts ?? 0));
    setValidityDays(String(data.proposalValidityDays ?? 5));
    setFollowUpAt(toLocalDateTime(data.followUpAt));
    setCommercials(
      Object.fromEntries(
        data.lines.map((line) => [
          line.id,
          {
            purchaseAmount: line.purchaseAmount == null ? '' : String(line.purchaseAmount),
            saleAmount: line.saleAmount == null ? '' : String(line.saleAmount),
          },
        ]),
      ),
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await apiAuthGet<RequestDetail>(`/requests/${id}`);
      applyRequest(data);
      setError(null);
    } catch {
      setError(ru.requests.notFound);
    }
  }, [applyRequest, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const rows = Object.values(commercials);
    const purchase = rows.reduce((sum, row) => sum + numberValue(row.purchaseAmount), 0);
    const sale = rows.reduce((sum, row) => sum + numberValue(row.saleAmount), 0);
    const profit = sale - purchase - numberValue(logisticsCost) - numberValue(otherCosts);
    return {
      purchase,
      sale,
      profit,
      margin: sale > 0 ? (profit / sale) * 100 : 0,
    };
  }, [commercials, logisticsCost, otherCosts]);

  async function onSearch() {
    setSearching(true);
    setError(null);
    try {
      const data = await apiAuthPost<RequestDetail>(`/requests/${id}/search`, {});
      applyRequest(data);
    } catch {
      setError(ru.requests.searchFailed);
    } finally {
      setSearching(false);
    }
  }

  async function onPrepareQuote() {
    if (!request) return;
    if (request.lines.some((line) => !commercials[line.id]?.purchaseAmount || !commercials[line.id]?.saleAmount)) {
      setError(ru.requests.quoteEveryLine);
      return;
    }
    setSavingQuote(true);
    setError(null);
    try {
      const data = await apiAuthPost<RequestDetail>(`/requests/${id}/quote`, {
        lines: request.lines.map((line) => ({
          lineId: line.id,
          purchaseAmount: numberValue(commercials[line.id].purchaseAmount),
          saleAmount: numberValue(commercials[line.id].saleAmount),
        })),
        currency,
        sellerName,
        deliveryTerms: deliveryTerms || undefined,
        logisticsCost: numberValue(logisticsCost),
        otherCosts: numberValue(otherCosts),
        proposalValidityDays: Number(validityDays),
        followUpAt: new Date(followUpAt).toISOString(),
      });
      applyRequest(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : ru.requests.quoteFailed);
    } finally {
      setSavingQuote(false);
    }
  }

  function updateCommercial(lineId: string, field: keyof CommercialLine, value: string) {
    setCommercials((current) => ({
      ...current,
      [lineId]: { ...current[lineId], [field]: value },
    }));
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
      <div className="max-w-5xl">
        <Link href="/dashboard/requests" className="text-sm text-slate-400 hover:text-white">
          {ru.requests.back}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{request?.title ?? ru.requests.detailTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {ru.requests.status}: {request?.status === 'QUOTED' ? ru.requests.quoted : request?.status}
            </p>
          </div>
          {request?.status === 'QUOTED' && (
            <Link
              href={`/dashboard/requests/${id}/proposal`}
              className="rounded-md border border-emerald-500 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-950"
            >
              {ru.requests.openProposal}
            </Link>
          )}
        </div>
        {request?.notes && <p className="mt-4 text-sm text-slate-400">{request.notes}</p>}

        <section className="mt-8">
          <h2 className="text-sm font-medium text-slate-300">{ru.requests.positionsAndPrices}</h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-800">
            {request?.lines.map((line) => (
              <div key={line.id} className="grid gap-3 border-b border-slate-800 p-4 last:border-b-0 md:grid-cols-[1fr_180px_180px]">
                <div>
                  <div className="font-medium">{line.rawLine ?? line.steelGrade ?? '—'}</div>
                  <div className="text-sm text-slate-500">
                    {[line.steelGrade, line.gost, line.quantity && `${line.quantity} ${line.unit ?? ''}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <label className="text-xs text-slate-400">
                  {ru.requests.purchaseAmount}
                  <input
                    inputMode="decimal"
                    value={commercials[line.id]?.purchaseAmount ?? ''}
                    onChange={(event) => updateCommercial(line.id, 'purchaseAmount', event.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    placeholder="0"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  {ru.requests.saleAmount}
                  <input
                    inputMode="decimal"
                    value={commercials[line.id]?.saleAmount ?? ''}
                    onChange={(event) => updateCommercial(line.id, 'saleAmount', event.target.value)}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    placeholder="0"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium">{ru.requests.calculation}</h2>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              {['RUB', 'USD', 'UZS', 'KZT'].map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs text-slate-400">
              {ru.requests.sellerName}
              <input
                value={sellerName}
                onChange={(event) => setSellerName(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              {ru.requests.deliveryTerms}
              <input
                value={deliveryTerms}
                onChange={(event) => setDeliveryTerms(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                placeholder="DAP Ташкент, 20–25 дней"
              />
            </label>
            <label className="text-xs text-slate-400">
              {ru.requests.logisticsCost}
              <input
                inputMode="decimal"
                value={logisticsCost}
                onChange={(event) => setLogisticsCost(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              {ru.requests.otherCosts}
              <input
                inputMode="decimal"
                value={otherCosts}
                onChange={(event) => setOtherCosts(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              {ru.requests.validityDays}
              <input
                type="number"
                min={1}
                max={90}
                value={validityDays}
                onChange={(event) => setValidityDays(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              {ru.requests.followUpAt}
              <input
                required
                type="datetime-local"
                value={followUpAt}
                onChange={(event) => setFollowUpAt(event.target.value)}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Metric label={ru.requests.purchaseTotal} value={money(totals.purchase, currency)} />
            <Metric label={ru.requests.saleTotal} value={money(totals.sale, currency)} />
            <Metric
              label={ru.requests.profit}
              value={money(totals.profit, currency)}
              accent={totals.profit >= 0 ? 'positive' : 'negative'}
            />
            <Metric
              label={ru.requests.margin}
              value={`${totals.margin.toFixed(2)}%`}
              accent={totals.margin >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <button
            type="button"
            onClick={() => void onPrepareQuote()}
            disabled={savingQuote || !followUpAt || sellerName.trim().length < 2}
            className="mt-5 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
          >
            {savingQuote ? ru.requests.preparingQuote : ru.requests.prepareQuote}
          </button>
          <p className="mt-2 text-xs text-slate-500">{ru.requests.followUpHint}</p>
        </section>

        <button
          type="button"
          onClick={() => void onSearch()}
          disabled={searching}
          className="mt-6 rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-50"
        >
          {searching ? ru.requests.searching : ru.requests.searchEmetall}
        </button>

        {offers.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-medium text-slate-300">{ru.requests.offers}</h2>
            <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-800">
              {offers.map((offer, index) => (
                <li key={index} className="px-4 py-3 text-sm">
                  <div className="font-medium">{offer.supplierName}</div>
                  <div className="text-slate-500">
                    {offer.price != null ? `${offer.price} ${offer.currency ?? 'RUB'}` : '—'}
                    {offer.region ? ` · ${offer.region}` : ''}
                    {offer.inStock ? ` · ${ru.requests.inStock}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {request?.status === 'SEARCHED' && offers.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{ru.requests.searchDoneEmpty}</p>
        )}

        {error && <p className="mt-4 whitespace-pre-wrap text-sm text-amber-400">{error}</p>}
      </div>
    </RequireAuth>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'positive' | 'negative';
}) {
  const color = accent === 'positive' ? 'text-emerald-300' : accent === 'negative' ? 'text-red-300' : 'text-white';
  return (
    <div className="rounded-md bg-slate-950 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 font-semibold ${color}`}>{value}</div>
    </div>
  );
}
