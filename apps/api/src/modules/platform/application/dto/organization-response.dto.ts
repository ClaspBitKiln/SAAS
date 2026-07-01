import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Organization } from '../../domain/entities/organization.entity';

export class OrganizationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() inn!: string | null;
  @ApiPropertyOptional({ type: 'object', additionalProperties: true }) settings!: Record<string, unknown>;
  @ApiProperty() version!: number;
}

export function toOrganizationResponse(o: Organization): OrganizationResponseDto {
  return {
    id: o.id,
    tenantId: o.tenantId,
    name: o.name,
    inn: o.inn,
    settings: o.settings,
    version: o.version,
  };
}
