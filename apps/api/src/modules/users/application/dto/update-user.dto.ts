import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== '')
  @IsUrl()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ example: 'ru-RU' })
  @IsOptional()
  @IsString()
  @Length(2, 16)
  locale?: string;

  @ApiPropertyOptional({ example: 'Europe/Moscow' })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  timezone?: string;
}
