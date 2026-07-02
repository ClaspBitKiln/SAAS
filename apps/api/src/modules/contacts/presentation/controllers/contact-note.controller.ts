import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/infrastructure/current-user.decorator';
import { AccessTokenPayload } from '../../../auth/infrastructure/access-token.service';
import { requireOrganizationId } from '../../../auth/infrastructure/require-organization';
import { CreateContactNoteCommand } from '../../application/commands/contact-note.commands';
import { CreateContactNoteDto, ContactNoteResponseDto } from '../../application/dto/contact-note.dto';
import { ListContactNotesQuery } from '../../application/queries/contact-note.queries';

@ApiTags('contact-notes')
@ApiBearerAuth()
@Controller('contacts/:contactId/notes')
export class ContactNoteController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @ApiOkResponse({ type: ContactNoteResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('contactId') contactId: string,
  ): Promise<ContactNoteResponseDto[]> {
    try {
      return await this.queryBus.execute(
        new ListContactNotesQuery(contactId, requireOrganizationId(user)),
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'Contact not found') throw new NotFoundException(e.message);
      throw e;
    }
  }

  @Post()
  @ApiOkResponse({ type: ContactNoteResponseDto })
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('contactId') contactId: string,
    @Body() dto: CreateContactNoteDto,
  ): Promise<ContactNoteResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      const { id } = await this.commandBus.execute(
        new CreateContactNoteCommand(contactId, organizationId, dto.body, user.sub),
      );
      const notes: ContactNoteResponseDto[] = await this.queryBus.execute(
        new ListContactNotesQuery(contactId, organizationId),
      );
      const created = notes.find((n: ContactNoteResponseDto) => n.id === id);
      if (!created) throw new Error('Note not found after create');
      return created;
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Contact not found') throw new NotFoundException(e.message);
        if (e.message.startsWith('Note body')) throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
