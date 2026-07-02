import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ minLength: 2, maxLength: 255 })
  @IsString()
  @Length(2, 255)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}
