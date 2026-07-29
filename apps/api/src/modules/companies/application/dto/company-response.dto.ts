import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyStatusEnum } from '../../domain/value-objects/company-status.vo';
import { CompanyCountryEnum } from '../../domain/value-objects/inn.vo';
import { Company } from '../../domain/entities/company.entity';

export class CompanyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() ownerUserId!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: CompanyCountryEnum }) country!: CompanyCountryEnum;
  @ApiPropertyOptional() inn!: string | null;
  @ApiPropertyOptional() website!: string | null;
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() email!: string | null;
  @ApiPropertyOptional() city!: string | null;
  @ApiPropertyOptional() industry!: string | null;
  @ApiPropertyOptional() leadPriority!: string | null;
  @ApiPropertyOptional() potentialNeed!: string | null;
  @ApiPropertyOptional() managerComment!: string | null;
  @ApiPropertyOptional() sourceUrl!: string | null;
  @ApiPropertyOptional() sourceName!: string | null;
  @ApiPropertyOptional() verifiedAt!: Date | null;
  @ApiProperty({ enum: CompanyStatusEnum }) status!: CompanyStatusEnum;
  @ApiProperty() version!: number;
}

export function toCompanyResponse(c: Company): CompanyResponseDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    organizationId: c.organizationId,
    ownerUserId: c.ownerUserId,
    name: c.name,
    country: c.country,
    inn: c.inn,
    website: c.website,
    phone: c.phone,
    email: c.email,
    city: c.city,
    industry: c.industry,
    leadPriority: c.leadPriority,
    potentialNeed: c.potentialNeed,
    managerComment: c.managerComment,
    sourceUrl: c.sourceUrl,
    sourceName: c.sourceName,
    verifiedAt: c.verifiedAt,
    status: c.status,
    version: c.version,
  };
}
