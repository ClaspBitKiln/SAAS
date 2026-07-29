import { Injectable } from '@nestjs/common';
import { connect, TLSSocket } from 'node:tls';
import { ProposalEmailSender } from '../application/services/proposal-email.service';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

function smtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number(process.env.SMTP_PORT ?? '465');
  const mailbox = /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/;
  if (
    !host ||
    /[\s\r\n]/.test(host) ||
    !user ||
    !password ||
    !from ||
    !mailbox.test(from) ||
    !Number.isInteger(port) ||
    port < 1
  ) {
    throw new Error('Email delivery not configured');
  }
  return { host, port, user, password, from };
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
}

function dotStuff(value: string): string {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
}

@Injectable()
export class SmtpProposalEmailSender implements ProposalEmailSender {
  async send(message: { to: string; subject: string; text: string; html: string }): Promise<void> {
    const smtp = smtpConfig();
    const socket = await this.open(smtp);
    try {
      await this.expect(socket, [220]);
      await this.command(socket, 'EHLO sales-os', [250]);
      await this.command(socket, 'AUTH LOGIN', [334]);
      await this.command(socket, Buffer.from(smtp.user).toString('base64'), [334]);
      await this.command(socket, Buffer.from(smtp.password).toString('base64'), [235]);
      await this.command(socket, `MAIL FROM:<${smtp.from}>`, [250]);
      await this.command(socket, `RCPT TO:<${message.to}>`, [250, 251]);
      await this.command(socket, 'DATA', [354]);

      const boundary = `sales-os-${Date.now().toString(36)}`;
      const body = [
        `From: <${smtp.from}>`,
        `To: <${message.to}>`,
        `Subject: ${encodeHeader(message.subject)}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(message.text).toString('base64'),
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(message.html).toString('base64'),
        `--${boundary}--`,
      ].join('\r\n');
      socket.write(`${dotStuff(body)}\r\n.\r\n`);
      await this.expect(socket, [250]);
      await this.command(socket, 'QUIT', [221]);
    } finally {
      socket.destroy();
    }
  }

  private open(smtp: SmtpConfig): Promise<TLSSocket> {
    return new Promise((resolve, reject) => {
      const socket = connect(
        { host: smtp.host, port: smtp.port, servername: smtp.host, rejectUnauthorized: true },
        () => {
          socket.pause();
          resolve(socket);
        },
      );
      socket.setTimeout(15_000, () => socket.destroy(new Error('SMTP timeout')));
      socket.once('error', reject);
    });
  }

  private async command(socket: TLSSocket, command: string, expected: number[]): Promise<void> {
    socket.write(`${command}\r\n`);
    await this.expect(socket, expected);
  }

  private expect(socket: TLSSocket, expected: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      let response = '';
      const onData = (chunk: Buffer) => {
        response += chunk.toString('utf8');
        const lines = response.split(/\r?\n/).filter(Boolean);
        const last = lines.at(-1);
        if (!last || !/^\d{3} /.test(last)) return;
        cleanup();
        const code = Number(last.slice(0, 3));
        if (expected.includes(code)) resolve();
        else reject(new Error(`SMTP rejected command (${code})`));
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = () => {
        cleanup();
        reject(new Error('SMTP connection closed'));
      };
      const cleanup = () => {
        socket.pause();
        socket.off('data', onData);
        socket.off('error', onError);
        socket.off('close', onClose);
      };
      socket.on('data', onData);
      socket.once('error', onError);
      socket.once('close', onClose);
      socket.resume();
    });
  }
}
