import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/infrastructure/current-user.decorator';
import { AccessTokenPayload } from '../../../auth/infrastructure/access-token.service';
import { requireOrganizationId } from '../../../auth/infrastructure/require-organization';
import { CreateContactDto } from '../../application/dto/create-contact.dto';
import { UpdateContactDto } from '../../application/dto/update-contact.dto';
import { ContactResponseDto } from '../../application/dto/contact-response.dto';
import {
  CreateContactCommand,
  DeleteContactCommand,
  UpdateContactCommand,
} from '../../application/commands/contact.commands';
import { GetContactQuery, ListContactsQuery } from '../../application/queries/contact.queries';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: ContactResponseDto })
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      const { id } = await this.commandBus.execute(
        new CreateContactCommand(organizationId, dto.name, dto.phone, dto.email),
      );
      return this.getOrFail(id, organizationId);
    } catch (e) {
      if (e instanceof Error && e.message === 'Organization not found') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: ContactResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ) {
    const organizationId = requireOrganizationId(user);
    return this.queryBus.execute(
      new ListContactsQuery(organizationId, Number(page), Math.min(Number(size), 100)),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: ContactResponseDto })
  async get(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<ContactResponseDto> {
    return this.getOrFail(id, requireOrganizationId(user));
  }

  @Patch(':id')
  @ApiOkResponse({ type: ContactResponseDto })
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(
        new UpdateContactCommand(id, organizationId, dto.name, dto.phone, dto.email),
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'Contact not found') throw new NotFoundException(e.message);
      throw e;
    }
    return this.getOrFail(id, organizationId);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<void> {
    try {
      await this.commandBus.execute(new DeleteContactCommand(id, requireOrganizationId(user)));
    } catch (e) {
      if (e instanceof Error && e.message === 'Contact not found') throw new NotFoundException(e.message);
      throw e;
    }
  }

  private async getOrFail(id: string, organizationId: string): Promise<ContactResponseDto> {
    const contact = await this.queryBus.execute(new GetContactQuery(id, organizationId));
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }
}
