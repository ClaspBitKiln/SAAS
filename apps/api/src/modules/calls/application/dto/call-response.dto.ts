import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CallDirectionEnum } from '../../domain/value-objects/call-direction.vo';
import { CallStatusEnum } from '../../domain/value-objects/call-status.vo';
import { Call } from '../../domain/entities/call.entity';

export class CallResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() contactId!: string;
  @ApiProperty({ enum: CallDirectionEnum }) direction!: CallDirectionEnum;
  @ApiProperty() phone!: string;
  @ApiProperty({ enum: CallStatusEnum }) status!: CallStatusEnum;
  @ApiProperty() startedAt!: string;
  @ApiPropertyOptional() endedAt!: string | null;
  @ApiPropertyOptional() durationSec!: number | null;
  @ApiProperty() version!: number;
}

export function toCallResponse(c: Call): CallResponseDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    organizationId: c.organizationId,
    contactId: c.contactId,
    direction: c.direction,
    phone: c.phone,
    status: c.status,
    startedAt: c.startedAt.toISOString(),
    endedAt: c.endedAt?.toISOString() ?? null,
    durationSec: c.durationSec,
    version: c.version,
  };
}
