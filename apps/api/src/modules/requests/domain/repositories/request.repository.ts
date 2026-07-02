import { Request } from '../entities/request.entity';

export const REQUEST_REPOSITORY = Symbol('REQUEST_REPOSITORY');

export interface RequestRepository {
  findById(id: string, organizationId: string): Promise<Request | null>;
  listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Request[]; total: number }>;
  save(request: Request): Promise<void>;
}
