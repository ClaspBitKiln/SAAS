import { Membership } from '../entities/membership.entity';

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY');

export interface MembershipRepository {
  findById(id: string): Promise<Membership | null>;
  findByUserAndOrganization(userId: string, organizationId: string): Promise<Membership | null>;
  listByUser(userId: string, params: { page: number; size: number }): Promise<{ items: Membership[]; total: number }>;
  listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Membership[]; total: number }>;
  findDefaultActiveByUser(userId: string): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}
