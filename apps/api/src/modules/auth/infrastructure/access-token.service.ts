import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/domain/entities/user.entity';
import { Membership } from '../../memberships/domain/entities/membership.entity';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  organizationId: string | null;
}

@Injectable()
export class AccessTokenService {
  constructor(private readonly jwtService: JwtService) {}

  get accessTtl(): string {
    return process.env.JWT_ACCESS_TTL ?? '15m';
  }

  async sign(user: User, membership: Membership | null): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      tenantId: membership?.tenantId ?? null,
      organizationId: membership?.organizationId ?? null,
    };
    return this.jwtService.signAsync(payload);
  }
}
