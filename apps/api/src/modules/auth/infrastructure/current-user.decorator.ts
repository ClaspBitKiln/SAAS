import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from './access-token.service';
import { AuthenticatedRequest } from './authenticated-request';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
