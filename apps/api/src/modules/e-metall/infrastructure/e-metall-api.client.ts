import { Injectable } from '@nestjs/common';
import {
  EMetallFilterRequestDto,
  EMetallFilterResultDto,
  EMetallParseRequestDto,
  EMetallParseResultDto,
  EMetallSearchRequestDto,
  EMetallSearchResultDto,
} from '../application/dto/e-metall.dto';
import { EMetallConfig, isEMetallConfigured, loadEMetallConfig } from './e-metall.config';

export const EMETALL_API_CLIENT = Symbol('EMETALL_API_CLIENT');

export interface EMetallApiClient {
  filter(request: EMetallFilterRequestDto): Promise<EMetallFilterResultDto>;
  parse(request: EMetallParseRequestDto): Promise<EMetallParseResultDto>;
  search(request: EMetallSearchRequestDto): Promise<EMetallSearchResultDto>;
}

@Injectable()
export class HttpEMetallApiClient implements EMetallApiClient {
  private readonly config: EMetallConfig = loadEMetallConfig();

  async filter(request: EMetallFilterRequestDto): Promise<EMetallFilterResultDto> {
    return this.post<EMetallFilterResultDto>('/filter', request, { relevant: false, status: 'NOT_CONFIGURED' });
  }

  async parse(request: EMetallParseRequestDto): Promise<EMetallParseResultDto> {
    return this.post<EMetallParseResultDto>('/parse', request, { lines: [], status: 'NOT_CONFIGURED' });
  }

  async search(request: EMetallSearchRequestDto): Promise<EMetallSearchResultDto> {
    return this.post<EMetallSearchResultDto>('/search', request, { offers: [], status: 'NOT_CONFIGURED' });
  }

  private async post<T extends { status: string }>(
    path: string,
    body: unknown,
    notConfigured: T,
  ): Promise<T> {
    if (!isEMetallConfigured(this.config)) {
      return notConfigured;
    }
    try {
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        return { ...notConfigured, status: 'ERROR' } as T;
      }
      const data = (await res.json()) as T;
      return { ...data, status: 'OK' };
    } catch {
      return { ...notConfigured, status: 'ERROR' } as T;
    }
  }
}
