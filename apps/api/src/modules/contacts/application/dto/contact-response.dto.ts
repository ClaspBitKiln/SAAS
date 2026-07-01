import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatusEnum } from '../../domain/value-objects/contact-status.vo';
import { Contact } from '../../domain/entities/contact.entity';

export class ContactResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() phone!: string | null;
  @ApiPropertyOptional() email!: string | null;
  @ApiProperty({ enum: ContactStatusEnum }) status!: ContactStatusEnum;
  @ApiProperty() version!: number;
}

export function toContactResponse(c: Contact): ContactResponseDto {
  return {
    id: c.id,
    tenantId: c.tenantId,
    organizationId: c.organizationId,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: c.status,
    version: c.version,
  };
}
