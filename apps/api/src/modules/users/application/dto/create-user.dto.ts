import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'manager@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 2, maxLength: 255, example: 'Alex Manager' })
  @IsString()
  @Length(2, 255)
  name!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

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
