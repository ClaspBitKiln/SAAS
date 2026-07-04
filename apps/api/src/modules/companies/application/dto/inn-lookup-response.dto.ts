import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InnLookupResponseDto {
  @ApiProperty({ description: 'Is DADATA_API_KEY configured on the server' }) configured!: boolean;
  @ApiProperty() found!: boolean;
  @ApiPropertyOptional() inn?: string;
  @ApiPropertyOptional({ description: 'Short name with OPF (ООО «Ромашка»)' }) name?: string;
  @ApiPropertyOptional() fullName?: string;
  @ApiPropertyOptional() ogrn?: string;
  @ApiPropertyOptional() kpp?: string;
  @ApiPropertyOptional() address?: string;
  @ApiPropertyOptional({ description: 'EGRUL state: ACTIVE | LIQUIDATING | LIQUIDATED | BANKRUPT | REORGANIZING' })
  status?: string;
  @ApiPropertyOptional() managementName?: string;
  @ApiPropertyOptional() managementPost?: string;
}
