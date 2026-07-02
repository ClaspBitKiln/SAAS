import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EMetallFilterRequestDto {
  @ApiProperty() @IsString() @Length(1, 50000) rawText!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fromEmail?: string;
}

export class EMetallFilterResultDto {
  @ApiProperty() relevant!: boolean;
  @ApiPropertyOptional() confidence?: number;
  @ApiPropertyOptional() reason?: string;
  @ApiProperty() status!: 'OK' | 'NOT_CONFIGURED' | 'ERROR';
  @ApiPropertyOptional() jobId?: string;
}

export class EMetallParsedLineDto {
  @ApiPropertyOptional() gost?: string;
  @ApiPropertyOptional() steelGrade?: string;
  @ApiPropertyOptional() productType?: string;
  @ApiPropertyOptional() dimensions?: string;
  @ApiPropertyOptional() length?: string;
  @ApiPropertyOptional() thickness?: string;
  @ApiPropertyOptional() coating?: string;
  @ApiPropertyOptional() quantity?: string;
  @ApiPropertyOptional() unit?: string;
  @ApiPropertyOptional() rawLine?: string;
}

export class EMetallParseRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() rawText?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
}

export class EMetallParseResultDto {
  @ApiProperty({ type: [EMetallParsedLineDto] }) lines!: EMetallParsedLineDto[];
  @ApiProperty() status!: 'OK' | 'NOT_CONFIGURED' | 'ERROR';
  @ApiPropertyOptional() jobId?: string;
}

export class EMetallSearchRequestDto {
  @ApiProperty({ type: [EMetallParsedLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EMetallParsedLineDto)
  lines!: EMetallParsedLineDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
}

export class EMetallOfferDto {
  @ApiProperty() supplierName!: string;
  @ApiPropertyOptional() region?: string;
  @ApiPropertyOptional() price?: number;
  @ApiPropertyOptional() currency?: string;
  @ApiPropertyOptional() leadTimeDays?: number;
  @ApiPropertyOptional() inStock?: boolean;
  @ApiPropertyOptional() isAnalogue?: boolean;
  @ApiPropertyOptional() matchedLineIndex?: number;
}

export class EMetallSearchResultDto {
  @ApiProperty({ type: [EMetallOfferDto] }) offers!: EMetallOfferDto[];
  @ApiProperty() status!: 'OK' | 'NOT_CONFIGURED' | 'ERROR';
  @ApiPropertyOptional() jobId?: string;
}

export class EMetallStatusDto {
  @ApiProperty() enabled!: boolean;
  @ApiProperty() configured!: boolean;
  @ApiPropertyOptional() baseUrl?: string;
}

export class EMetallWebhookPayloadDto {
  @ApiProperty() @IsString() jobId!: string;
  @ApiProperty() @IsString() jobType!: 'filter' | 'parse' | 'search';
  @ApiProperty() @IsUUID() tenantId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() organizationId?: string;
  @ApiProperty() @IsBoolean() success!: boolean;
  @ApiPropertyOptional() result?: Record<string, unknown>;
  @ApiPropertyOptional() error?: string;
}
