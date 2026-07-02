import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';
import { RequestStatusEnum } from '../../domain/value-objects/request-status.vo';

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
  @ApiProperty({ format: 'uuid' }) @IsUUID() organizationId!: string;
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
