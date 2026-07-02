import { ForbiddenException } from '@nestjs/common';
import { AccessTokenPayload } from './access-token.service';

export function requireOrganizationId(user: AccessTokenPayload): string {
  if (!user.organizationId) {
    throw new ForbiddenException('Organization context required');
  }
  return user.organizationId;
}
