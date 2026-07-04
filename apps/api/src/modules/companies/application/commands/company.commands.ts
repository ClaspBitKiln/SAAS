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
  ) {}
}

export class DeleteCompanyCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
