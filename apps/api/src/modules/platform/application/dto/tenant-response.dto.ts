import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../domain/entities/tenant.entity';

export class TenantResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: ['FREE', 'PRO', 'BUSINESS'] }) plan!: string;
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED'] }) status!: string;
  @ApiProperty() version!: number;
}

export function toTenantResponse(t: Tenant): TenantResponseDto {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    plan: t.plan.value,
    status: t.status.value,
    version: t.version,
  };
}
