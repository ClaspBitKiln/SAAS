import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { CompanyCountryEnum } from '../../domain/value-objects/inn.vo';

export class CreateCompanyDto {
  @ApiProperty({ minLength: 2, maxLength: 255 })
  @IsString()
  @Length(2, 255)
  name!: string;

  @ApiPropertyOptional({ enum: CompanyCountryEnum, default: CompanyCountryEnum.RU })
  @IsOptional()
  @IsEnum(CompanyCountryEnum)
  country?: CompanyCountryEnum;

  @ApiPropertyOptional({ description: 'Tax id: RU ИНН 10/12 · UZ СТИР 9 · KZ БИН 12 · KG ИНН 14' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9,14}$/)
  inn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 2048)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Responsible manager; defaults to creator' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;
}
