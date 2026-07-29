'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { apiAuthGet, apiAuthPost, apiAuthUpload } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { ru } from '@/lib/ru';

interface RequestLine {
  gost?: string;
  steelGrade?: string;
  productType?: string;
  dimensions?: string;
  length?: string;
  thickness?: string;
  coating?: string;
  quantity?: string;
  unit?: string;
  rawLine?: string;
}

interface Contact {
  id: string;
  name: string;
}

const emptyLine = (): RequestLine => ({
  rawLine: '',
  steelGrade: '',
  gost: '',
  thickness: '',
  quantity: '',
});

export default function NewRequestPage() {
  const router = useRouter();
  const orgId = getAuthUser()?.organizationId;
  const [tab, setTab] = useState<'manual' | 'file'>('manual');
  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<RequestLine[]>([emptyLine()]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [rawText, setRawText] = useState('');
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [parser, setParser] = useState<string | null>(null);
  const [intakeSource, setIntakeSource] = useState<'MANUAL' | 'PASTED' | 'FILE'>('MANUAL');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    apiAuthGet<{ items: Contact[] }>(`/contacts?organizationId=${orgId}`)
      .then((d) => setContacts(d.items))
      .catch(() => undefined);
  }, [orgId]);

  const applyParsedLines = useCallback(
    (parsed: RequestLine[], parserName: string, source: 'PASTED' | 'FILE') => {
      setLines(parsed.length > 0 ? parsed : [emptyLine()]);
      setParser(parserName);
      setIntakeSource(source);
      setTab('manual');
    },
    [],
  );

  async function onParseText(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiAuthPost<{ lines: RequestLine[]; parser: string }>('/requests/parse', {
        rawText,
      });
      applyParsedLines(result.lines, result.parser, 'PASTED');
    } catch {
      setError(ru.requests.parseFailed);
    } finally {
      setLoading(false);
    }
  }

  async function onFileChange(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiAuthUpload<{
        lines: RequestLine[];
        parser: string;
        sourceText: string;
        sourceFileName: string;
      }>(
        '/requests/parse/file',
        file,
      );
      setRawText(result.sourceText);
      setSourceFileName(result.sourceFileName);
      applyParsedLines(result.lines, result.parser, 'FILE');
    } catch {
      setError(ru.requests.fileParseFailed);
    } finally {
      setLoading(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const filtered = lines.filter((l) => l.rawLine || l.steelGrade || l.gost);
      if (filtered.length === 0) {
        setError(ru.requests.linesRequired);
        setLoading(false);
        return;
      }
      const created = await apiAuthPost<{ id: string }>('/requests', {
        organizationId: orgId,
        contactId: contactId || undefined,
        title: title || undefined,
        notes: notes || undefined,
        sourceText:
          intakeSource === 'PASTED'
            ? rawText.trim() || undefined
            : intakeSource === 'FILE'
              ? [sourceFileName ? `${ru.requests.sourceFile}: ${sourceFileName}` : null, rawText.trim()]
                  .filter(Boolean)
                  .join('\n\n') || undefined
              : undefined,
        source: intakeSource,
        lines: filtered,
      });
      router.push(`/dashboard/requests/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : ru.common.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  function updateLine(index: number, field: keyof RequestLine, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length === 1 ? [emptyLine()] : prev.filter((_, i) => i !== index)));
  }

  return (
    <RequireAuth>
      <div className="max-w-3xl">
        <Link href="/dashboard/requests" className="text-sm text-slate-400 hover:text-white">
          {ru.requests.back}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">{ru.requests.newTitle}</h1>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`rounded-md px-4 py-2 text-sm ${tab === 'manual' ? 'bg-slate-800' : 'text-slate-400'}`}
          >
            {ru.requests.manual}
          </button>
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`rounded-md px-4 py-2 text-sm ${tab === 'file' ? 'bg-slate-800' : 'text-slate-400'}`}
          >
            {ru.requests.fromMessage}
          </button>
        </div>

        {tab === 'file' && (
          <div className="mt-4 space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">{ru.requests.pasteLabel}</span>
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                placeholder={ru.requests.pastePlaceholder}
              />
            </label>
            <button
              type="button"
              disabled={loading || !rawText.trim()}
              onClick={(e) => void onParseText(e as unknown as FormEvent)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm disabled:opacity-50"
            >
              {ru.requests.parseText}
            </button>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">{ru.requests.uploadLabel}</span>
              <input
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
                className="text-sm text-slate-400"
              />
            </label>
          </div>
        )}

        <form onSubmit={onSave} className="mt-6 space-y-4">
          {parser && (
            <div className="rounded-md border border-amber-700/60 bg-amber-950/30 p-3 text-sm text-amber-200">
              {ru.requests.parsedWith(parser)} {ru.requests.reviewRequired}
              {sourceFileName && (
                <span className="mt-1 block text-amber-100">
                  {ru.requests.sourceFile}: {sourceFileName}
                </span>
              )}
            </div>
          )}
          <input
            placeholder={ru.requests.titleField}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">{ru.requests.contactOptional}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <textarea
            placeholder={ru.requests.notes}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">{ru.requests.lineItems}</h2>
              <button
                type="button"
                onClick={() => setLines((p) => [...p, emptyLine()])}
                className="text-sm text-blue-400"
              >
                {ru.requests.addLine}
              </button>
            </div>
            {lines.map((line, i) => (
              <div key={i} className="grid gap-2 rounded-md border border-slate-800 p-3 sm:grid-cols-2">
                <div className="flex gap-2 sm:col-span-2">
                  <input
                    placeholder={ru.requests.rawLine}
                    value={line.rawLine ?? ''}
                    onChange={(e) => updateLine(i, 'rawLine', e.target.value)}
                    className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-400 hover:text-white"
                    aria-label={ru.requests.removeLine}
                  >
                    ×
                  </button>
                </div>
                <input
                  placeholder={ru.requests.productType}
                  value={line.productType ?? ''}
                  onChange={(e) => updateLine(i, 'productType', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <input
                  placeholder={ru.requests.steelGrade}
                  value={line.steelGrade ?? ''}
                  onChange={(e) => updateLine(i, 'steelGrade', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <input
                  placeholder={ru.requests.gost}
                  value={line.gost ?? ''}
                  onChange={(e) => updateLine(i, 'gost', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <input
                  placeholder={ru.requests.dimensions}
                  value={line.dimensions ?? ''}
                  onChange={(e) => updateLine(i, 'dimensions', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <input
                  placeholder={ru.requests.thickness}
                  value={line.thickness ?? ''}
                  onChange={(e) => updateLine(i, 'thickness', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <input
                  placeholder={ru.requests.qty}
                  value={line.quantity ?? ''}
                  onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
                <input
                  placeholder={ru.requests.unit}
                  value={line.unit ?? ''}
                  onChange={(e) => updateLine(i, 'unit', e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading || !orgId}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? ru.common.saving : ru.requests.saveRequest}
          </button>
        </form>
      </div>
    </RequireAuth>
  );
}
