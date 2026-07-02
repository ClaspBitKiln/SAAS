import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/public.decorator';
import {
  EMetallFilterRequestDto,
  EMetallFilterResultDto,
  EMetallParseRequestDto,
  EMetallParseResultDto,
  EMetallSearchRequestDto,
  EMetallSearchResultDto,
  EMetallStatusDto,
  EMetallWebhookPayloadDto,
} from '../../application/dto/e-metall.dto';
import { EMetallIntegrationService } from '../../application/services/e-metall-integration.service';
import { loadEMetallConfig } from '../../infrastructure/e-metall.config';

@ApiTags('integrations/e-metall')
@Controller('integrations/e-metall')
export class EMetallController {
  constructor(private readonly integration: EMetallIntegrationService) {}

  @Get('status')
  @ApiBearerAuth()
  @ApiOkResponse({ type: EMetallStatusDto })
  status(): EMetallStatusDto {
    return this.integration.getStatus();
  }

  @Post('jobs/filter')
  @ApiBearerAuth()
  @ApiOkResponse({ type: EMetallFilterResultDto })
  filter(@Body() dto: EMetallFilterRequestDto): Promise<EMetallFilterResultDto> {
    return this.integration.filter(dto);
  }

  @Post('jobs/parse')
  @ApiBearerAuth()
  @ApiOkResponse({ type: EMetallParseResultDto })
  parse(@Body() dto: EMetallParseRequestDto): Promise<EMetallParseResultDto> {
    return this.integration.parse(dto);
  }

  @Post('jobs/search')
  @ApiBearerAuth()
  @ApiOkResponse({ type: EMetallSearchResultDto })
  search(@Body() dto: EMetallSearchRequestDto): Promise<EMetallSearchResultDto> {
    return this.integration.search(dto);
  }

  @Public()
  @Post('webhook')
  @ApiOkResponse({ schema: { properties: { accepted: { type: 'boolean' } } } })
  webhook(
    @Headers('x-emetall-secret') secret: string | undefined,
    @Body() payload: EMetallWebhookPayloadDto,
  ): { accepted: boolean } {
    const config = loadEMetallConfig();
    if (config.webhookSecret && secret !== config.webhookSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return this.integration.handleWebhook(payload);
  }
}
