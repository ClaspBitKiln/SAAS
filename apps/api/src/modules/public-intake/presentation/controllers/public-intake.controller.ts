import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/public.decorator';
import {
  PublicEventResponseDto,
  PublicFunnelEventDto,
  PublicLeadDto,
  PublicLeadResponseDto,
} from '../../application/dto/public-intake.dto';
import { PublicIntakeService } from '../../application/services/public-intake.service';

@ApiTags('public-intake')
@ApiBearerAuth()
@Public()
@Controller('integrations/site/v1')
export class PublicIntakeController {
  constructor(private readonly service: PublicIntakeService) {}

  @Post('leads')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'Must match externalLeadId',
  })
  @ApiHeader({
    name: 'X-Tenant-Id',
    required: true,
    description: 'Organization UUID configured for the website gateway',
  })
  @ApiOkResponse({ type: PublicLeadResponseDto })
  async createLead(
    @Body() dto: PublicLeadDto,
    @Headers('authorization') authorization?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('origin') origin?: string,
  ): Promise<PublicLeadResponseDto> {
    return this.service.createLead(
      dto,
      authorization,
      idempotencyKey,
      tenantId,
      origin,
    );
  }

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiHeader({
    name: 'X-Tenant-Id',
    required: true,
    description: 'Organization UUID configured for the website gateway',
  })
  @ApiOkResponse({ type: PublicEventResponseDto })
  async acceptEvent(
    @Body() dto: PublicFunnelEventDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('origin') origin?: string,
  ): Promise<PublicEventResponseDto> {
    await this.service.acceptEvent(dto, authorization, tenantId, origin);
    return { ok: true };
  }
}
