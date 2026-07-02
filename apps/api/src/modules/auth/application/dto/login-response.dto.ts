import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: string;
  @ApiProperty() expiresIn!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() tenantId!: string | null;
  @ApiPropertyOptional() organizationId!: string | null;
}
