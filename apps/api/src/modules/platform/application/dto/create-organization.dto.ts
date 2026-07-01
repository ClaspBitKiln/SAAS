import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ format: 'uuid', example: '0192a1b2-c3d4-7890-abcd-ef1234567890' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ minLength: 2, maxLength: 255, example: 'ООО Ромашка' })
  @IsString()
  @Length(2, 255)
  name!: string;

  @ApiPropertyOptional({ description: '10 или 12 цифр', example: '7707083893' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$|^\d{12}$/, { message: 'inn must be 10 or 12 digits' })
  inn?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
