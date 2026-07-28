import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';
import { RequestStatusEnum } from '../../domain/value-objects/request-status.vo';
import { ProposalSentViaEnum } from '../../domain/value-objects/proposal-sent-via.vo';

export class RequestLineDto {
  @ApiPropertyOptional() @IsOptional() @IsString() gost?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() steelGrade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dimensions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() length?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() thickness?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coating?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() quantity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rawLine?: string;
}

export class CreateRequestDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() contactId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 255) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 2000) notes?: string;
  @ApiPropertyOptional({ enum: RequestSourceEnum }) @IsOptional() @IsEnum(RequestSourceEnum) source?: RequestSourceEnum;
  @ApiProperty({ type: [RequestLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestLineDto)
  lines!: RequestLineDto[];
}

export class UpdateRequestDto {
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID() contactId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string | null;
  @ApiPropertyOptional({ type: [RequestLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestLineDto)
  lines?: RequestLineDto[];
}

export class QuoteLineDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() lineId!: string;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) purchaseAmount!: number;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) saleAmount!: number;
}

export class PrepareQuoteDto {
  @ApiProperty({ type: [QuoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines!: QuoteLineDto[];

  @ApiProperty({ example: 'RUB' })
  @IsString()
  @Matches(/^[A-Za-z]{3}$/)
  currency!: string;

  @ApiProperty({ example: 'ООО «Мэджик Металл»' })
  @IsString()
  @Length(2, 255)
  sellerName!: string;

  @ApiPropertyOptional({ example: 'DAP Ташкент, срок поставки 20–25 дней' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  deliveryTerms?: string;

  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) logisticsCost!: number;
  @ApiProperty({ minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) otherCosts!: number;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  proposalValidityDays?: number;

  @ApiProperty({ description: 'ISO datetime for the mandatory next contact' })
  @IsDateString()
  followUpAt!: string;
}

export class MarkProposalSentDto {
  @ApiProperty({ enum: ProposalSentViaEnum })
  @IsEnum(ProposalSentViaEnum)
  sentVia!: ProposalSentViaEnum;
}

export class ParseRequestDto {
  @ApiProperty() @IsString() @Length(1, 100000) rawText!: string;
}

export class RequestLineResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() sortOrder!: number;
  @ApiPropertyOptional() gost?: string | null;
  @ApiPropertyOptional() steelGrade?: string | null;
  @ApiPropertyOptional() productType?: string | null;
  @ApiPropertyOptional() dimensions?: string | null;
  @ApiPropertyOptional() length?: string | null;
  @ApiPropertyOptional() thickness?: string | null;
  @ApiPropertyOptional() coating?: string | null;
  @ApiPropertyOptional() quantity?: string | null;
  @ApiPropertyOptional() unit?: string | null;
  @ApiPropertyOptional() rawLine?: string | null;
  @ApiPropertyOptional() purchaseAmount?: number | null;
  @ApiPropertyOptional() saleAmount?: number | null;
}

export class RequestResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() contactId?: string | null;
  @ApiPropertyOptional() title?: string | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiProperty({ enum: RequestSourceEnum }) source!: RequestSourceEnum;
  @ApiProperty({ enum: RequestStatusEnum }) status!: RequestStatusEnum;
  @ApiPropertyOptional() searchResult?: Record<string, unknown> | null;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() sellerName!: string | null;
  @ApiPropertyOptional() deliveryTerms!: string | null;
  @ApiProperty() logisticsCost!: number;
  @ApiProperty() otherCosts!: number;
  @ApiProperty() purchaseTotal!: number;
  @ApiProperty() saleTotal!: number;
  @ApiProperty() profitAmount!: number;
  @ApiProperty() marginPercent!: number;
  @ApiPropertyOptional() proposalNumber!: string | null;
  @ApiPropertyOptional() proposalIssuedAt!: string | null;
  @ApiProperty() proposalValidityDays!: number;
  @ApiPropertyOptional() proposalSentAt!: string | null;
  @ApiPropertyOptional({ enum: ProposalSentViaEnum }) proposalSentVia!: ProposalSentViaEnum | null;
  @ApiPropertyOptional() followUpAt!: string | null;
  @ApiProperty({ type: [RequestLineResponseDto] }) lines!: RequestLineResponseDto[];
  @ApiProperty() createdAt!: string;
}

export class ParseRequestResponseDto {
  @ApiProperty({ type: [RequestLineDto] }) lines!: RequestLineDto[];
  @ApiProperty() parser!: 'e-metall' | 'fallback';
}

export class RequestListResponseDto {
  @ApiProperty({ type: [RequestResponseDto] }) items!: RequestResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() size!: number;
}
