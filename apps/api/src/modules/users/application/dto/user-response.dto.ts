import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatusEnum } from '../../domain/value-objects/user-status.vo';
import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() avatarUrl!: string | null;
  @ApiProperty() locale!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty({ enum: UserStatusEnum }) status!: UserStatusEnum;
  @ApiPropertyOptional() lastLoginAt!: string | null;
  @ApiProperty() version!: number;
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    timezone: user.timezone,
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    version: user.version,
  };
}
