import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { CompanyCountryEnum } from '../../domain/value-objects/inn.vo';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @ApiPropertyOptional({ enum: CompanyCountryEnum })
  @IsOptional()
  @IsEnum(CompanyCountryEnum)
  country?: CompanyCountryEnum;

  @ApiPropertyOptional({ description: 'Tax id: RU ИНН 10/12 · UZ СТИР 9 · KZ БИН 12 · KG ИНН 14' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{9,14}$/)
  inn?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 2048)
  website?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 50)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Responsible manager; null unsets' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string | null;
}
