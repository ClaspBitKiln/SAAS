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

interface RequestItem {
  id: string;
  status: string;
  createdAt: string;
  proposalIssuedAt: string | null;
  proposalDownloadedAt: string | null;
  proposalSentAt: string | null;
  outcome: string | null;
}

interface RequestListResponse {
  items: RequestItem[];
  total: number;
}

interface PilotStep {
  key: 'company' | 'contact' | 'request' | 'quote' | 'sent' | 'outcome';
  complete: boolean;
  href: string;
}

const PILOT_REQUEST_TARGET = 20;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export default function DashboardPage() {
  const user = getAuthUser();
  const orgId = user?.organizationId;
  const [contactsTotal, setContactsTotal] = useState<number | null>(null);
  const [callsTotal, setCallsTotal] = useState<number | null>(null);
  const [completedCalls, setCompletedCalls] = useState<number | null>(null);
  const [pilotSteps, setPilotSteps] = useState<PilotStep[] | null>(null);
  const [pilotRequests, setPilotRequests] = useState<RequestItem[] | null>(null);
  const [pilotLoadFailed, setPilotLoadFailed] = useState(false);

  useEffect(() => {
    if (!orgId) return;

    Promise.all([
      apiAuthGet<ListResponse>('/companies?page=1&size=1'),
      apiAuthGet<ListResponse>(`/contacts?organizationId=${orgId}&page=1&size=1`),
      apiAuthGet<ListResponse>(`/calls?organizationId=${orgId}&page=1&size=1`),
      apiAuthGet<{ items: { status: string }[] }>(`/calls?organizationId=${orgId}&page=1&size=100`),
      apiAuthGet<RequestListResponse>('/requests?page=1&size=100'),
    ])
      .then(([companies, contacts, calls, allCalls, requests]) => {
        setContactsTotal(contacts.total);
        setCallsTotal(calls.total);
        setCompletedCalls(allCalls.items.filter((c) => c.status === 'COMPLETED').length);
        setPilotRequests(requests.items);
        const quoteRequest = requests.items.find((request) =>
          ['QUOTED', 'SENT'].includes(request.status),
        );
        const proposalPendingDelivery = requests.items.find(
          (request) =>
            request.status === 'QUOTED' ||
            (request.status === 'SENT' && !request.proposalDownloadedAt),
        );
        const sentWithoutOutcome = requests.items.find(
          (request) => request.status === 'SENT' && !request.outcome,
        );
        const requestToQuote = requests.items.find((request) =>
          ['DRAFT', 'SEARCHED'].includes(request.status),
        );

        setPilotSteps([
          { key: 'company', complete: companies.total > 0, href: '/dashboard/companies' },
          { key: 'contact', complete: contacts.total > 0, href: '/dashboard/contacts' },
          { key: 'request', complete: requests.total > 0, href: '/dashboard/requests/new' },
          {
            key: 'quote',
            complete: Boolean(quoteRequest),
            href: requestToQuote
              ? `/dashboard/requests/${requestToQuote.id}`
              : '/dashboard/requests',
          },
          {
            key: 'sent',
            complete: requests.items.some(
              (request) => request.status === 'SENT' && Boolean(request.proposalDownloadedAt),
            ),
            href: proposalPendingDelivery
              ? `/dashboard/requests/${proposalPendingDelivery.id}/proposal`
              : '/dashboard/requests',
          },
          {
            key: 'outcome',
            complete: requests.items.some((request) => Boolean(request.outcome)),
            href: sentWithoutOutcome
              ? `/dashboard/requests/${sentWithoutOutcome.id}`
              : '/dashboard/requests',
          },
        ]);
        setPilotLoadFailed(false);
      })
      .catch(() => {
        setContactsTotal(null);
        setCallsTotal(null);
        setCompletedCalls(null);
        setPilotSteps(null);
        setPilotRequests(null);
        setPilotLoadFailed(true);
      });
  }, [orgId]);

  const completedPilotSteps = pilotSteps?.filter((step) => step.complete).length ?? 0;
  const nextPilotStep = pilotSteps?.find((step) => !step.complete) ?? null;
  const pilotProgress = pilotSteps
    ? Math.round((completedPilotSteps / pilotSteps.length) * 100)
    : 0;
  const quotedRequests =
    pilotRequests?.filter((request) => Boolean(request.proposalIssuedAt)).length ?? 0;
  const sentRequests =
    pilotRequests?.filter((request) => Boolean(request.proposalSentAt)).length ?? 0;
  const outcomeRequests =
    pilotRequests?.filter((request) => Boolean(request.outcome)).length ?? 0;
  const quoteLeadTimeHours = median(
    (pilotRequests ?? [])
      .filter((request) => request.proposalIssuedAt)
      .map(
        (request) =>
          (new Date(request.proposalIssuedAt as string).getTime() -
            new Date(request.createdAt).getTime()) /
          3_600_000,
      )
      .filter((hours) => Number.isFinite(hours) && hours >= 0),
  );
  const pilotSampleProgress = pilotRequests
    ? Math.min(100, Math.round((pilotRequests.length / PILOT_REQUEST_TARGET) * 100))
    : 0;

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
        {orgId && (
          <section className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{ru.dashboard.pilotTitle}</h2>
                <p className="mt-1 text-sm text-slate-400">{ru.dashboard.pilotSubtitle}</p>
              </div>
              {pilotSteps && (
                <div className="text-right">
                  <div className="text-2xl font-semibold text-emerald-300">{pilotProgress}%</div>
                  <div className="text-xs text-slate-500">
                    {ru.dashboard.pilotCompleted(completedPilotSteps, pilotSteps.length)}
                  </div>
                </div>
              )}
            </div>

            {pilotLoadFailed ? (
              <p className="mt-4 text-sm text-amber-400">{ru.dashboard.pilotLoadFailed}</p>
            ) : !pilotSteps ? (
              <p className="mt-4 text-sm text-slate-500">{ru.common.loading}</p>
            ) : (
              <>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label={ru.dashboard.pilotTitle}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pilotProgress}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pilotProgress}%` }}
                  />
                </div>
                <ol className="mt-5 grid gap-3 md:grid-cols-2">
                  {pilotSteps.map((step, index) => (
                    <li key={step.key}>
                      <Link
                        href={step.href}
                        className={`flex items-center gap-3 rounded-md border px-3 py-3 text-sm transition ${
                          step.complete
                            ? 'border-emerald-900/70 bg-emerald-950/30 text-emerald-300'
                            : step === nextPilotStep
                              ? 'border-blue-600 bg-blue-950/30 text-blue-200 hover:border-blue-400'
                              : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            step.complete
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {step.complete ? '✓' : index + 1}
                        </span>
                        <span className="flex-1">{ru.dashboard.pilotStep(step.key)}</span>
                        {!step.complete && step === nextPilotStep && (
                          <span className="text-xs text-blue-300">
                            {ru.dashboard.pilotNext}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ol>
                {nextPilotStep ? (
                  <Link
                    href={nextPilotStep.href}
                    className="mt-5 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
                  >
                    {ru.dashboard.pilotContinue}
                  </Link>
                ) : (
                  <p className="mt-5 rounded-md bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                    {ru.dashboard.pilotReady}
                  </p>
                )}

                <div className="mt-6 border-t border-slate-800 pt-5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{ru.dashboard.pilotMetricsTitle}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {ru.dashboard.pilotMetricsSubtitle}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {ru.dashboard.pilotSample(
                        pilotRequests?.length ?? 0,
                        PILOT_REQUEST_TARGET,
                      )}
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${pilotSampleProgress}%` }}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      [ru.dashboard.pilotRequests, pilotRequests?.length ?? 0],
                      [ru.dashboard.pilotQuotes, quotedRequests],
                      [ru.dashboard.pilotSent, sentRequests],
                      [ru.dashboard.pilotOutcomes, outcomeRequests],
                      [
                        ru.dashboard.pilotQuoteTime,
                        quoteLeadTimeHours === null
                          ? '—'
                          : ru.dashboard.pilotHours(quoteLeadTimeHours),
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-slate-950/50 px-3 py-3">
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className="mt-1 text-xl font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </RequireAuth>
  );
}
