import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatusEnum } from '../../domain/value-objects/company-status.vo';
import { Company } from '../../domain/entities/company.entity';

export class CompanyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() inn!: string | null;
  @ApiPropertyOptional() website!: string | null;
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() email!: string | null;
  @ApiProperty({ enum: CompanyStatusEnum }) status!: CompanyStatusEnum;
  @ApiProperty() version!: number;
}

export function toCompanyResponse(c: Company): CompanyResponseDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    organizationId: c.organizationId,
    name: c.name,
    inn: c.inn,
    website: c.website,
    phone: c.phone,
    email: c.email,
    status: c.status,
    version: c.version,
  };
}
