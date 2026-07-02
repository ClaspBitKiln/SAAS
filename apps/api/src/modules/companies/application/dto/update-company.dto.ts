import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$|^\d{12}$/)
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
}
