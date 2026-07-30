import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/public.decorator';
import {
  PublicEventResponseDto,
  PublicFunnelEventDto,
  PublicLeadDto,
  PublicLeadResponseDto,
} from '../../application/dto/public-intake.dto';
import { PublicIntakeService } from '../../application/services/public-intake.service';

@ApiTags('public-intake')
@Public()
@Controller('api/public/v1')
export class PublicIntakeController {
  constructor(private readonly service: PublicIntakeService) {}

  @Post('leads')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiHeader({
    name: 'X-Idempotency-Key',
    required: false,
    description: 'Must match externalLeadId when supplied',
  })
  @ApiOkResponse({ type: PublicLeadResponseDto })
  async createLead(
    @Body() dto: PublicLeadDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
    @Headers('origin') origin?: string,
  ): Promise<PublicLeadResponseDto> {
    return this.service.createLead(dto, idempotencyKey, origin);
  }

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOkResponse({ type: PublicEventResponseDto })
  acceptEvent(
    @Body() dto: PublicFunnelEventDto,
    @Headers('origin') origin?: string,
  ): PublicEventResponseDto {
    this.service.acceptEvent(dto, origin);
    return { ok: true };
  }
}
