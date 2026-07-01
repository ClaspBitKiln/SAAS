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
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
@Controller('contacts')
export class ContactController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: ContactResponseDto })
  async create(@Body() dto: CreateContactDto): Promise<ContactResponseDto> {
    try {
      const { id } = await this.commandBus.execute(
        new CreateContactCommand(dto.organizationId, dto.name, dto.phone, dto.email),
      );
      return this.getOrFail(id);
    } catch (e) {
      if (e instanceof Error && e.message === 'Organization not found') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: ContactResponseDto, isArray: true })
  async list(@Query('organizationId') organizationId: string, @Query('page') page = '1', @Query('size') size = '25') {
    if (!organizationId) throw new BadRequestException('organizationId required');
    return this.queryBus.execute(new ListContactsQuery(organizationId, Number(page), Math.min(Number(size), 100)));
  }

  @Get(':id')
  @ApiOkResponse({ type: ContactResponseDto })
  async get(@Param('id') id: string): Promise<ContactResponseDto> {
    return this.getOrFail(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ContactResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto): Promise<ContactResponseDto> {
    try {
      await this.commandBus.execute(new UpdateContactCommand(id, dto.name, dto.phone, dto.email));
    } catch (e) {
      if (e instanceof Error && e.message === 'Contact not found') throw new NotFoundException(e.message);
      throw e;
    }
    return this.getOrFail(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    try {
      await this.commandBus.execute(new DeleteContactCommand(id));
    } catch (e) {
      if (e instanceof Error && e.message === 'Contact not found') throw new NotFoundException(e.message);
      throw e;
    }
  }

  private async getOrFail(id: string): Promise<ContactResponseDto> {
    const contact = await this.queryBus.execute(new GetContactQuery(id));
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }
}
