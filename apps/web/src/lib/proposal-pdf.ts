import type { TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';

export interface ProposalPdfLine {
  id: string;
  rawLine?: string | null;
  steelGrade?: string | null;
  gost?: string | null;
  quantity?: string | null;
  unit?: string | null;
  saleAmount?: number | null;
}

export interface ProposalPdfRequest {
  title: string | null;
  currency: string;
  sellerName: string | null;
  deliveryTerms: string | null;
  saleTotal: number;
  proposalNumber: string | null;
  proposalIssuedAt: string | null;
  proposalValidityDays: number;
  lines: ProposalPdfLine[];
}

export interface ProposalPdfContact {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface ProposalPdfCompany {
  name: string;
  inn: string | null;
}

interface ProposalPdfInput {
  request: ProposalPdfRequest;
  contact: ProposalPdfContact | null;
  company: ProposalPdfCompany | null;
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

function proposalFileName(proposalNumber: string | null): string {
  const safeNumber = (proposalNumber ?? 'commercial-proposal')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .trim();
  return `${safeNumber || 'commercial-proposal'}.pdf`;
}

export function buildProposalPdf({ request, contact, company }: ProposalPdfInput): TDocumentDefinitions {
  const validUntil = request.proposalIssuedAt
    ? new Date(new Date(request.proposalIssuedAt).getTime() + request.proposalValidityDays * 86400000)
    : null;
  const buyerName = company?.name ?? contact?.name ?? 'Уточнить покупателя';
  const contactDetails = contact
    ? [contact.name, contact.phone, contact.email].filter(Boolean).join(' · ')
    : null;
  const tableBody: TableCell[][] = [
    [
      { text: '№', style: 'tableHeader' },
      { text: 'Наименование', style: 'tableHeader' },
      { text: 'Количество', style: 'tableHeader' },
      { text: 'Стоимость', style: 'tableHeader', alignment: 'right' },
    ],
    ...request.lines.map((line, index): TableCell[] => [
      String(index + 1),
      {
        stack: [
          { text: line.rawLine ?? line.steelGrade ?? '—' },
          {
            text: [line.steelGrade, line.gost].filter(Boolean).join(' · '),
            color: '#64748b',
            fontSize: 8,
          },
        ],
      },
      [line.quantity, line.unit].filter(Boolean).join(' ') || '—',
      {
        text: money(line.saleAmount ?? 0, request.currency),
        alignment: 'right',
        noWrap: true,
      },
    ]),
    [
      { text: 'Итого:', colSpan: 3, alignment: 'right', bold: true, margin: [0, 3, 0, 3] },
      {},
      {},
      {
        text: money(request.saleTotal, request.currency),
        alignment: 'right',
        bold: true,
        noWrap: true,
        margin: [0, 3, 0, 3],
      },
    ],
  ];

  return {
    info: {
      title: `Коммерческое предложение ${request.proposalNumber ?? ''}`.trim(),
      author: request.sellerName ?? undefined,
      subject: request.title ?? 'Поставка металлопроката',
    },
    pageSize: 'A4',
    pageMargins: [42, 42, 42, 48],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      color: '#0f172a',
    },
    content: [
      {
        text: request.sellerName ?? '',
        style: 'eyebrow',
      },
      {
        text: 'Коммерческое предложение',
        style: 'title',
        margin: [0, 8, 0, 6],
      },
      {
        text: `№ ${request.proposalNumber ?? '—'} от ${date(request.proposalIssuedAt)}`,
        color: '#475569',
        margin: [0, 0, 0, 18],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'ПОСТАВЩИК', style: 'label' },
              { text: request.sellerName ?? '—', bold: true, margin: [0, 4, 0, 0] },
            ],
          },
          {
            width: '*',
            stack: [
              { text: 'ПОКУПАТЕЛЬ', style: 'label' },
              { text: buyerName, bold: true, margin: [0, 4, 0, 0] },
              ...(company?.inn ? [{ text: `ИНН/код: ${company.inn}`, color: '#475569' }] : []),
              ...(contactDetails ? [{ text: `Контакт: ${contactDetails}`, color: '#475569' }] : []),
            ],
          },
        ],
        columnGap: 24,
        margin: [0, 0, 0, 18],
      },
      {
        text: `Предлагаем поставить металлопрокат по заявке «${request.title ?? 'заявка на металл'}»:`,
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: [22, '*', 72, 92],
          body: tableBody,
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#0f172a' : null),
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
      {
        stack: [
          {
            text: [
              { text: 'Условия поставки: ', bold: true },
              request.deliveryTerms || 'согласовываются сторонами',
            ],
          },
          {
            text: [
              { text: 'Срок действия предложения: ', bold: true },
              `до ${validUntil ? date(validUntil.toISOString()) : '—'}`,
            ],
            margin: [0, 5, 0, 0],
          },
          {
            text: [
              { text: 'Валюта предложения: ', bold: true },
              request.currency,
            ],
            margin: [0, 5, 0, 0],
          },
        ],
        margin: [0, 18, 0, 0],
        fillColor: '#f8fafc',
      },
      {
        columns: [
          { text: 'Поставщик / подпись', margin: [0, 42, 0, 0] },
          { text: 'Покупатель / подпись', margin: [0, 42, 0, 0] },
        ],
        columnGap: 36,
      },
    ],
    styles: {
      title: {
        fontSize: 22,
        bold: true,
      },
      eyebrow: {
        fontSize: 9,
        color: '#64748b',
        characterSpacing: 1.2,
      },
      label: {
        fontSize: 8,
        bold: true,
        color: '#64748b',
        characterSpacing: 0.8,
      },
      tableHeader: {
        bold: true,
        color: '#ffffff',
      },
    },
  };
}

export async function downloadProposalPdf(input: ProposalPdfInput): Promise<void> {
  const [pdfMakeModule, fontFilesModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);

  const pdfMake = pdfMakeModule.default;
  pdfMake.addVirtualFileSystem(fontFilesModule.default);
  await pdfMake.createPdf(buildProposalPdf(input)).download(proposalFileName(input.request.proposalNumber));
}
