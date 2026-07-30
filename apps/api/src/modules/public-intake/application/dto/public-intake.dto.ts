import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicLeadContactDto {
  @ApiProperty({ example: 'Иван' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '+7 900 000-00-00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value!: string;
}

export class PublicLeadRequestDto {
  @ApiProperty({ example: 'Лист 09Г2С 10×1500×6000, 12 тонн, Ташкент' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  text!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pageTitle?: string;

  @ApiPropertyOptional({ example: 'https://www.magicmet.ru/catalog/' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  pageUrl?: string;
}

export class PublicLeadConsentDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  personalData!: boolean;

  @ApiProperty({ example: '2026-07-30T14:00:00.000Z' })
  @IsDateString()
  capturedAt!: string;
}

export class PublicLeadDto {
  @ApiProperty({ example: '3ef65221-47bc-4b03-a98f-84de03f378ba' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{8,128}$/)
  externalLeadId!: string;

  @ApiProperty({ example: 'magicmet-website' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sourceSystem!: string;

  @ApiPropertyOptional({ example: '2026-07-30' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  apiVersion?: string | null;

  @ApiProperty({ example: '2026-07-30T14:00:00.000Z' })
  @IsDateString()
  submittedAt!: string;

  @ApiProperty({ example: 'request_to_quote' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  leadType!: string;

  @ApiProperty({ example: 'RU_CIS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  market!: string;

  @ApiProperty({ type: PublicLeadContactDto })
  @ValidateNested()
  @Type(() => PublicLeadContactDto)
  contact!: PublicLeadContactDto;

  @ApiProperty({ type: PublicLeadRequestDto })
  @ValidateNested()
  @Type(() => PublicLeadRequestDto)
  request!: PublicLeadRequestDto;

  @ApiProperty({ type: PublicLeadConsentDto })
  @ValidateNested()
  @Type(() => PublicLeadConsentDto)
  consent!: PublicLeadConsentDto;

  @ApiProperty({ type: Object })
  @IsObject()
  attribution!: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  journey?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  technical?: Record<string, unknown>;
}

export class PublicFunnelEventDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{8,128}$/)
  eventId!: string;

  @ApiProperty({ example: 'catalog_search' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiProperty({ example: 'magicmet-website' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sourceSystem!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  apiVersion?: string | null;

  @ApiProperty({ example: 'RU_CIS' })
  @IsString()
  @MaxLength(32)
  market!: string;

  @ApiProperty({ example: '/catalog/' })
  @IsString()
  @MaxLength(2048)
  path!: string;

  @ApiProperty({ example: 'https://www.magicmet.ru/catalog/' })
  @IsString()
  @MaxLength(2048)
  url!: string;

  @ApiProperty()
  @IsDateString()
  occurredAt!: string;

  @ApiProperty()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{8,128}$/)
  sessionId!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  attribution?: Record<string, unknown>;
}

export class PublicLeadResponseDto {
  @ApiProperty({ example: true })
  ok!: true;

  @ApiProperty({ example: '018f7cd8-f7cc-7f49-a8f5-495c2b56ee3c' })
  leadId!: string;

  @ApiProperty({ example: '3ef65221-47bc-4b03-a98f-84de03f378ba' })
  externalLeadId!: string;

  @ApiProperty({ example: false })
  duplicate!: boolean;
}

export class PublicEventResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}
