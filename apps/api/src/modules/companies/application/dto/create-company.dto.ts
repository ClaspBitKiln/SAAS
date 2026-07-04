import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ minLength: 2, maxLength: 255 })
  @IsString()
  @Length(2, 255)
  name!: string;

  @ApiPropertyOptional({ description: 'Russian INN: 10 or 12 digits' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$|^\d{12}$/)
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
