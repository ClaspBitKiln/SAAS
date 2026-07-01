import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipStatusEnum } from '../../domain/value-objects/membership-status.vo';
import { Membership } from '../../domain/entities/membership.entity';

export class MembershipResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional() roleId!: string | null;
  @ApiProperty({ enum: MembershipStatusEnum }) status!: MembershipStatusEnum;
  @ApiPropertyOptional() invitedBy!: string | null;
  @ApiPropertyOptional() invitedAt!: string | null;
  @ApiPropertyOptional() joinedAt!: string | null;
  @ApiPropertyOptional() leftAt!: string | null;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() version!: number;
}

export function toMembershipResponse(m: Membership): MembershipResponseDto {
  return {
    id: m.id,
    tenantId: m.tenantId,
    userId: m.userId,
    organizationId: m.organizationId,
    roleId: m.roleId,
    status: m.status,
    invitedBy: m.invitedBy,
    invitedAt: m.invitedAt?.toISOString() ?? null,
    joinedAt: m.joinedAt?.toISOString() ?? null,
    leftAt: m.leftAt?.toISOString() ?? null,
    isDefault: m.isDefault,
    version: m.version,
  };
}
