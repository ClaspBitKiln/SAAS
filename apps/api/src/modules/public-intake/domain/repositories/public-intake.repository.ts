export const PUBLIC_INTAKE_REPOSITORY = Symbol('PUBLIC_INTAKE_REPOSITORY');

export type PublicIntakeContactChannel = {
  phone?: string;
  email?: string;
};

export type ExistingPublicLead = {
  requestId: string;
  contactId: string | null;
};

export interface PublicIntakeRepository {
  findOrganizationIdById(id: string): Promise<string | null>;
  findOrganizationIdByInn(inn: string): Promise<string | null>;
  findLeadByMarker(
    organizationId: string,
    marker: string,
  ): Promise<ExistingPublicLead | null>;
  findContactIdByChannel(
    organizationId: string,
    channel: PublicIntakeContactChannel,
  ): Promise<string | null>;
}
