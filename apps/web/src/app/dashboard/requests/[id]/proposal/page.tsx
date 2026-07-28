'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet } from '@/lib/api';
import { downloadProposalPdf } from '@/lib/proposal-pdf';
import { ru } from '@/lib/ru';

interface RequestLine {
  id: string;
  rawLine?: string | null;
  steelGrade?: string | null;
  gost?: string | null;
  quantity?: string | null;
  unit?: string | null;
  saleAmount?: number | null;
}

interface RequestDetail {
  id: string;
  contactId: string | null;
  title: string | null;
  status: string;
  currency: string;
  sellerName: string | null;
  deliveryTerms: string | null;
  saleTotal: number;
  proposalNumber: string | null;
  proposalIssuedAt: string | null;
  proposalValidityDays: number;
  lines: RequestLine[];
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: string | null;
}

interface Company {
  id: string;
  name: string;
  inn: string | null;
  country: string;
  email: string | null;
  phone: string | null;
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function date(value: string | null): string {
  return value ? new Intl.DateTimeFormat('ru-RU').format(new Date(value)) : '—';
}

export default function ProposalPage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const requestData = await apiAuthGet<RequestDetail>(`/requests/${id}`);
      setRequest(requestData);
      if (requestData.contactId) {
        const contactData = await apiAuthGet<Contact>(`/contacts/${requestData.contactId}`);
        setContact(contactData);
        if (contactData.companyId) {
          setCompany(await apiAuthGet<Company>(`/companies/${contactData.companyId}`));
        }
      }
    } catch {
      setError(ru.requests.notFound);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDownloadPdf() {
    if (!request) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadProposalPdf({ request, contact, company });
    } catch {
      setDownloadError(ru.requests.downloadProposalFailed);
    } finally {
      setDownloading(false);
    }
  }

  if (!request && !error) {
    return (
      <RequireAuth>
        <div>{ru.common.loading}</div>
      </RequireAuth>
    );
  }

  if (!request || request.status !== 'QUOTED') {
    return (
      <RequireAuth>
        <p className="text-amber-400">{error ?? ru.requests.proposalNotReady}</p>
      </RequireAuth>
    );
  }

  const validUntil = request.proposalIssuedAt
    ? new Date(new Date(request.proposalIssuedAt).getTime() + request.proposalValidityDays * 86400000)
    : null;

  return (
    <RequireAuth>
      <div className="proposal mx-auto max-w-4xl bg-white p-10 text-slate-950 shadow-xl">
        <div className="print:hidden mb-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            {ru.common.back}
          </button>
          <button
            type="button"
            onClick={() => void onDownloadPdf()}
            disabled={downloading}
            className="rounded bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {downloading ? ru.requests.downloadingProposal : ru.requests.downloadProposal}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-slate-300 px-4 py-2 text-sm"
          >
            {ru.requests.printProposal}
          </button>
        </div>
        {downloadError && <p className="print:hidden mb-4 text-right text-sm text-red-700">{downloadError}</p>}

        <header className="border-b-2 border-slate-900 pb-6">
          <div className="text-sm uppercase tracking-[0.2em] text-slate-500">{request.sellerName}</div>
          <h1 className="mt-3 text-3xl font-bold">Коммерческое предложение</h1>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <span>№ {request.proposalNumber}</span>
            <span>от {date(request.proposalIssuedAt)}</span>
          </div>
        </header>

        <section className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Поставщик</div>
            <div className="mt-2 font-semibold">{request.sellerName}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Покупатель</div>
            <div className="mt-2 font-semibold">{company?.name ?? contact?.name ?? 'Уточнить покупателя'}</div>
            {company?.inn && <div className="text-sm text-slate-600">ИНН/код: {company.inn}</div>}
            {contact && (
              <div className="text-sm text-slate-600">
                Контакт: {contact.name}
                {contact.phone ? ` · ${contact.phone}` : ''}
                {contact.email ? ` · ${contact.email}` : ''}
              </div>
            )}
          </div>
        </section>

        <p className="mt-7 text-sm">
          Предлагаем поставить металлопрокат по заявке «{request.title ?? 'заявка на металл'}»:
        </p>

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-left text-white">
              <th className="border border-slate-900 px-3 py-2">№</th>
              <th className="border border-slate-900 px-3 py-2">Наименование</th>
              <th className="border border-slate-900 px-3 py-2">Количество</th>
              <th className="border border-slate-900 px-3 py-2 text-right">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {request.lines.map((line, index) => (
              <tr key={line.id}>
                <td className="border border-slate-300 px-3 py-2">{index + 1}</td>
                <td className="border border-slate-300 px-3 py-2">
                  <div>{line.rawLine ?? line.steelGrade ?? '—'}</div>
                  <div className="text-xs text-slate-500">{[line.steelGrade, line.gost].filter(Boolean).join(' · ')}</div>
                </td>
                <td className="border border-slate-300 px-3 py-2">
                  {[line.quantity, line.unit].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {money(line.saleAmount ?? 0, request.currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="border border-slate-300 px-3 py-3 text-right font-semibold">Итого:</td>
              <td className="border border-slate-300 px-3 py-3 text-right text-lg font-bold">
                {money(request.saleTotal, request.currency)}
              </td>
            </tr>
          </tfoot>
        </table>

        <section className="mt-7 rounded border border-slate-300 p-4 text-sm">
          <div><strong>Условия поставки:</strong> {request.deliveryTerms || 'согласовываются сторонами'}</div>
          <div className="mt-2">
            <strong>Срок действия предложения:</strong> до {validUntil ? date(validUntil.toISOString()) : '—'}
          </div>
          <div className="mt-2"><strong>Валюта предложения:</strong> {request.currency}</div>
        </section>

        <footer className="mt-12 grid gap-10 text-sm sm:grid-cols-2">
          <div className="border-t border-slate-400 pt-2">Поставщик / подпись</div>
          <div className="border-t border-slate-400 pt-2">Покупатель / подпись</div>
        </footer>

        <style jsx global>{`
          @media print {
            aside {
              display: none !important;
            }
            main {
              padding: 0 !important;
            }
            body {
              background: white !important;
            }
            .proposal {
              max-width: none !important;
              box-shadow: none !important;
              padding: 18mm !important;
            }
          }
        `}</style>
      </div>
    </RequireAuth>
  );
}
