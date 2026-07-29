'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiAuthPost, apiAuthUpload } from '@/lib/api';
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

interface RequestActivity {
  type:
    | 'REQUEST_CREATED'
    | 'QUOTE_PREPARED'
    | 'FOLLOW_UP_SCHEDULED'
    | 'PROPOSAL_DOWNLOADED'
    | 'PROPOSAL_SENT'
    | 'OUTCOME_RECORDED';
  occurredAt: string;
  details: Record<string, string>;
}

interface RequestDetail {
  id: string;
  contactId: string | null;
  title: string | null;
  status: string;
  notes: string | null;
  sourceText: string | null;
  currency: string;
  sellerName: string | null;
  deliveryTerms: string | null;
  priceSourceFileName: string | null;
  logisticsCost: number;
  otherCosts: number;
  purchaseTotal: number;
  saleTotal: number;
  profitAmount: number;
  marginPercent: number;
  proposalNumber: string | null;
  proposalValidityDays: number;
  followUpAt: string | null;
  outcome: 'WON' | 'LOST' | 'NO_RESPONSE' | null;
  outcomeReason: string | null;
  outcomeAt: string | null;
  activity: RequestActivity[];
  lines: RequestLine[];
  searchResult?: { offers?: Offer[]; status?: string } | null;
}

interface CommercialLine {
  purchaseAmount: string;
  saleAmount: string;
}

interface PriceImportResponse {
  lines: Array<{ description: string; purchaseAmount: number; saleAmount?: number }>;
  sourceFileName: string;
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

function parseAmount(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function numberValue(value: string): number {
  return parseAmount(value) ?? 0;
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
  const [outcome, setOutcome] = useState<'WON' | 'LOST' | 'NO_RESPONSE'>('WON');
  const [outcomeReason, setOutcomeReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [importingPrices, setImportingPrices] = useState(false);
  const [priceImportNotice, setPriceImportNotice] = useState<string | null>(null);
  const [priceSourceFileName, setPriceSourceFileName] = useState<string | null>(null);

  const applyRequest = useCallback((data: RequestDetail) => {
    setRequest(data);
    setCurrency(data.currency || 'RUB');
    setSellerName(data.sellerName || 'ООО «Мэджик Металл»');
    setDeliveryTerms(data.deliveryTerms || '');
    setLogisticsCost(String(data.logisticsCost ?? 0));
    setOtherCosts(String(data.otherCosts ?? 0));
    setPriceSourceFileName(data.priceSourceFileName);
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

  async function onImportPrices(file: File) {
    if (!request) return;
    setImportingPrices(true);
    setError(null);
    setPriceImportNotice(null);
    try {
      const imported = await apiAuthUpload<PriceImportResponse>('/requests/prices/file', file);
      const normalizeDescription = (value: string | null | undefined) =>
        (value ?? '')
          .toLocaleLowerCase('ru-RU')
          .replace(/ё/g, 'е')
          .replace(/[^a-zа-я0-9]+/giu, '');
      const available = imported.lines.map((line) => ({ ...line, matched: false }));
      const matchedPrices = new Map<
        string,
        { description: string; purchaseAmount: number; saleAmount?: number }
      >();
      request.lines.forEach((line) => {
        const key = normalizeDescription(line.rawLine);
        const price = available.find(
          (candidate) =>
            !candidate.matched && key.length > 0 && normalizeDescription(candidate.description) === key,
        );
        if (!price) return;
        price.matched = true;
        matchedPrices.set(line.id, price);
      });
      setCommercials((current) => {
        const next = { ...current };
        request.lines.forEach((line) => {
          const price = matchedPrices.get(line.id);
          if (!price) return;
          next[line.id] = {
            purchaseAmount: String(price.purchaseAmount),
            saleAmount:
              price.saleAmount == null
                ? current[line.id]?.saleAmount ?? ''
                : String(price.saleAmount),
          };
        });
        return next;
      });
      setPriceSourceFileName(imported.sourceFileName);
      const applied = matchedPrices.size;
      setPriceImportNotice(
        applied === request.lines.length && applied === imported.lines.length
          ? ru.requests.priceImportApplied(imported.sourceFileName, applied)
          : `${ru.requests.priceImportApplied(imported.sourceFileName, applied)} ${ru.requests.priceImportMismatch(applied, imported.lines.length, request.lines.length)}`,
      );
    } catch {
      setError(ru.requests.priceImportFailed);
    } finally {
      setImportingPrices(false);
    }
  }

  async function onPrepareQuote() {
    if (!request) return;
    if (request.lines.some((line) => !commercials[line.id]?.purchaseAmount || !commercials[line.id]?.saleAmount)) {
      setError(ru.requests.quoteEveryLine);
      return;
    }
    const amountValues = [
      ...request.lines.flatMap((line) => [
        commercials[line.id].purchaseAmount,
        commercials[line.id].saleAmount,
      ]),
      logisticsCost,
      otherCosts,
    ];
    if (amountValues.some((value) => parseAmount(value) === null)) {
      setError(ru.requests.quoteInvalidAmount);
      return;
    }
    const validity = Number(validityDays);
    if (!Number.isInteger(validity) || validity < 1 || validity > 90) {
      setError(ru.requests.quoteInvalidValidity);
      return;
    }
    const followUpDate = new Date(followUpAt);
    if (Number.isNaN(followUpDate.getTime()) || followUpDate.getTime() <= Date.now()) {
      setError(ru.requests.quoteFollowUpFuture);
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
        proposalValidityDays: validity,
        followUpAt: followUpDate.toISOString(),
        priceSourceFileName: priceSourceFileName || undefined,
      });
      applyRequest(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : ru.requests.quoteFailed);
    } finally {
      setSavingQuote(false);
    }
  }

  async function onRecordOutcome() {
    if (outcomeReason.trim().length < 2) {
      setError(ru.requests.outcomeReasonRequired);
      return;
    }
    setSavingOutcome(true);
    setError(null);
    try {
      const data = await apiAuthPost<RequestDetail>(`/requests/${id}/outcome`, {
        outcome,
        reason: outcomeReason.trim(),
      });
      applyRequest(data);
      setOutcomeReason('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : ru.requests.outcomeFailed);
    } finally {
      setSavingOutcome(false);
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
              {ru.requests.status}:{' '}
              {request?.status === 'SENT'
                ? ru.requests.sent
                : request?.status === 'QUOTED'
                  ? ru.requests.quoted
                  : request?.status}
            </p>
          </div>
          {request && ['QUOTED', 'SENT'].includes(request.status) && (
            <Link
              href={`/dashboard/requests/${id}/proposal`}
              className="rounded-md border border-emerald-500 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-950"
            >
              {ru.requests.openProposal}
            </Link>
          )}
        </div>
        {request?.notes && <p className="mt-4 text-sm text-slate-400">{request.notes}</p>}
        {request?.sourceText && (
          <details className="mt-4 rounded-md border border-slate-800 bg-slate-900/50 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-300">
              {ru.requests.originalMessage}
            </summary>
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-slate-400">
              {request.sourceText}
            </pre>
          </details>
        )}

        {request && (
          <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-medium">{ru.requests.activityTitle}</h2>
            <ol className="mt-4 space-y-4">
              {request.activity.map((item, index) => {
                const details = ru.requests.activityDetails(item.type, item.details);
                return (
                  <li key={`${item.type}-${item.occurredAt}`} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {ru.requests.activityLabel(item.type)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {new Intl.DateTimeFormat('ru-RU', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(item.occurredAt))}
                      </div>
                      {details && <div className="mt-1 text-sm text-slate-400">{details}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {request?.status === 'SENT' && (
          <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-medium">{ru.requests.outcomeTitle}</h2>
            {request.outcome ? (
              <div className="mt-3">
                <div className="text-lg font-semibold text-emerald-300">
                  {ru.requests.outcomeLabel(request.outcome)}
                </div>
                <p className="mt-1 text-sm text-slate-300">{request.outcomeReason}</p>
                {request.outcomeAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    {new Intl.DateTimeFormat('ru-RU', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(request.outcomeAt))}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_auto]">
                <select
                  value={outcome}
                  onChange={(event) =>
                    setOutcome(event.target.value as 'WON' | 'LOST' | 'NO_RESPONSE')
                  }
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="WON">{ru.requests.outcomeWon}</option>
                  <option value="LOST">{ru.requests.outcomeLost}</option>
                  <option value="NO_RESPONSE">{ru.requests.outcomeNoResponse}</option>
                </select>
                <input
                  value={outcomeReason}
                  onChange={(event) => setOutcomeReason(event.target.value)}
                  placeholder={ru.requests.outcomeReason}
                  maxLength={500}
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void onRecordOutcome()}
                  disabled={savingOutcome || outcomeReason.trim().length < 2}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm disabled:opacity-50"
                >
                  {savingOutcome ? ru.common.saving : ru.requests.saveOutcome}
                </button>
              </div>
            )}
          </section>
        )}

        <section className="mt-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-slate-300">{ru.requests.positionsAndPrices}</h2>
              <p className="mt-1 max-w-2xl text-xs text-slate-500">{ru.requests.priceImportHint}</p>
            </div>
            <label className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500">
              {importingPrices ? ru.requests.priceImporting : ru.requests.priceImport}
              <input
                type="file"
                accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={importingPrices}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onImportPrices(file);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
          {priceImportNotice && (
            <p className="mt-3 rounded border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
              {priceImportNotice}
            </p>
          )}
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
                min={toLocalDateTime(new Date().toISOString())}
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
