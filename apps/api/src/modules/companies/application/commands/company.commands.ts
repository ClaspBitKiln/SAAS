import { CompanyCountryEnum } from '../../domain/value-objects/inn.vo';

export class CreateCompanyCommand {
  constructor(
    readonly organizationId: string,
    readonly name: string,
    readonly inn?: string | null,
    readonly website?: string | null,
    readonly phone?: string | null,
    readonly email?: string | null,
    readonly ownerUserId?: string | null,
    readonly currentUserId?: string,
    readonly country?: CompanyCountryEnum,
    readonly city?: string | null,
    readonly industry?: string | null,
    readonly leadPriority?: string | null,
    readonly potentialNeed?: string | null,
    readonly managerComment?: string | null,
    readonly sourceUrl?: string | null,
    readonly sourceName?: string | null,
    readonly verifiedAt?: Date | null,
  ) {}
}

export class UpdateCompanyCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly name?: string,
    readonly inn?: string | null,
    readonly website?: string | null,
    readonly phone?: string | null,
    readonly email?: string | null,
    readonly ownerUserId?: string | null,
    readonly country?: CompanyCountryEnum,
    readonly city?: string | null,
    readonly industry?: string | null,
    readonly leadPriority?: string | null,
    readonly potentialNeed?: string | null,
    readonly managerComment?: string | null,
    readonly sourceUrl?: string | null,
    readonly sourceName?: string | null,
    readonly verifiedAt?: Date | null,
  ) {}
}

export class DeleteCompanyCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
