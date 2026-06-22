import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ minLength: 2, maxLength: 255, example: 'ООО Ромашка' })
  @IsString()
  @Length(2, 255)
  name!: string;

  @ApiProperty({ minLength: 2, maxLength: 64, example: 'romashka' })
  @IsString()
  @Length(2, 64)
  slug!: string;

  @ApiPropertyOptional({ enum: ['FREE', 'PRO', 'BUSINESS'], default: 'FREE' })
  @IsOptional()
  @IsIn(['FREE', 'PRO', 'BUSINESS'])
  plan?: string;
}
