import { Inject, Injectable } from '@nestjs/common';
import {
  EMetallFilterRequestDto,
  EMetallFilterResultDto,
  EMetallParseRequestDto,
  EMetallParseResultDto,
  EMetallSearchRequestDto,
  EMetallSearchResultDto,
  EMetallStatusDto,
  EMetallWebhookPayloadDto,
} from '../dto/e-metall.dto';
import { EMETALL_API_CLIENT, EMetallApiClient } from '../../infrastructure/e-metall-api.client';
import { isEMetallConfigured, loadEMetallConfig } from '../../infrastructure/e-metall.config';

@Injectable()
export class EMetallIntegrationService {
  private readonly config = loadEMetallConfig();

  constructor(@Inject(EMETALL_API_CLIENT) private readonly client: EMetallApiClient) {}

  getStatus(): EMetallStatusDto {
    return {
      enabled: this.config.enabled,
      configured: isEMetallConfigured(this.config),
      baseUrl: this.config.enabled ? this.config.baseUrl : undefined,
    };
  }

  filter(request: EMetallFilterRequestDto): Promise<EMetallFilterResultDto> {
    return this.client.filter(request);
  }

  parse(request: EMetallParseRequestDto): Promise<EMetallParseResultDto> {
    return this.client.parse(request);
  }

  search(request: EMetallSearchRequestDto): Promise<EMetallSearchResultDto> {
    return this.client.search(request);
  }

  handleWebhook(payload: EMetallWebhookPayloadDto): { accepted: boolean } {
    // Stage 1: acknowledge only. Stage 2: dispatch to Deal/Contact handlers.
    void payload;
    return { accepted: true };
  }
}
