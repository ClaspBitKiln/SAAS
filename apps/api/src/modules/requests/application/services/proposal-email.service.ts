import { Inject, Injectable } from '@nestjs/common';
import { REQUEST_REPOSITORY, RequestRepository } from '../../domain/repositories/request.repository';
import { RequestStatusEnum } from '../../domain/value-objects/request-status.vo';

export const PROPOSAL_EMAIL_SENDER = Symbol('PROPOSAL_EMAIL_SENDER');

export interface ProposalEmailSender {
  send(message: { to: string; subject: string; text: string; html: string }): Promise<void>;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

@Injectable()
export class ProposalEmailService {
  constructor(
    @Inject(REQUEST_REPOSITORY) private readonly requestRepo: RequestRepository,
    @Inject(PROPOSAL_EMAIL_SENDER) private readonly sender: ProposalEmailSender,
  ) {}

  async send(requestId: string, organizationId: string, to: string): Promise<void> {
    const quote = await this.requestRepo.findById(requestId, organizationId);
    if (!quote) throw new Error('Request not found');
    if (quote.status !== RequestStatusEnum.QUOTED || !quote.proposalNumber) {
      throw new Error('Request proposal: quote must be prepared before email delivery');
    }

    const subject = `Коммерческое предложение ${quote.proposalNumber}`;
    const rows = quote.lines.map((line, index) => {
      const name = line.rawLine ?? line.steelGrade ?? line.gost ?? 'Позиция';
      const quantity = [line.quantity, line.unit].filter(Boolean).join(' ') || '—';
      return {
        number: index + 1,
        name,
        quantity,
        amount: money(line.saleAmount ?? 0, quote.currency),
      };
    });
    const text = [
      quote.sellerName ?? '',
      subject,
      quote.title ?? 'Поставка металлопроката',
      '',
      ...rows.map((row) => `${row.number}. ${row.name} — ${row.quantity} — ${row.amount}`),
      '',
      `Итого: ${money(quote.saleTotal, quote.currency)}`,
      `Условия поставки: ${quote.deliveryTerms || 'согласовываются сторонами'}`,
    ].join('\n');
    const htmlRows = rows
      .map(
        (row) =>
          `<tr><td>${row.number}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.quantity)}</td><td>${escapeHtml(row.amount)}</td></tr>`,
      )
      .join('');
    const html = [
      `<h2>${escapeHtml(subject)}</h2>`,
      `<p>${escapeHtml(quote.title ?? 'Поставка металлопроката')}</p>`,
      '<table border="1" cellpadding="6" cellspacing="0">',
      '<thead><tr><th>№</th><th>Наименование</th><th>Количество</th><th>Стоимость</th></tr></thead>',
      `<tbody>${htmlRows}</tbody></table>`,
      `<p><strong>Итого: ${escapeHtml(money(quote.saleTotal, quote.currency))}</strong></p>`,
      `<p>Условия поставки: ${escapeHtml(quote.deliveryTerms || 'согласовываются сторонами')}</p>`,
      `<p>${escapeHtml(quote.sellerName ?? '')}</p>`,
    ].join('');

    await this.sender.send({ to, subject, text, html });
  }
}
