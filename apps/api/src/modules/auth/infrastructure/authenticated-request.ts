import { AccessTokenPayload } from './access-token.service';

export interface AuthenticatedRequest {
  user: AccessTokenPayload;
}
