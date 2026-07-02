import {
  BadRequestException,
  Body,
  Controller,
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
import { StartCallDto } from '../../application/dto/start-call.dto';
import { CallResponseDto } from '../../application/dto/call-response.dto';
import { CompleteCallCommand, MissCallCommand, StartCallCommand } from '../../application/commands/call.commands';
import {
  GetCallQuery,
  ListCallsByContactQuery,
  ListCallsByOrganizationQuery,
} from '../../application/queries/call.queries';

@ApiTags('calls')
@ApiBearerAuth()
@Controller('calls')
export class CallController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: CallResponseDto })
  async start(@CurrentUser() user: AccessTokenPayload, @Body() dto: StartCallDto): Promise<CallResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      const { id } = await this.commandBus.execute(
        new StartCallCommand(dto.contactId, dto.direction, dto.phone, organizationId),
      );
      return this.getOrFail(id, organizationId);
    } catch (e) {
      if (e instanceof Error && e.message === 'Contact not found') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: CallResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('contactId') contactId: string | undefined,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ) {
    const organizationId = requireOrganizationId(user);
    if (contactId) {
      return this.queryBus.execute(
        new ListCallsByContactQuery(contactId, organizationId, Number(page), Math.min(Number(size), 100)),
      );
    }
    return this.queryBus.execute(
      new ListCallsByOrganizationQuery(organizationId, Number(page), Math.min(Number(size), 100)),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: CallResponseDto })
  async get(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<CallResponseDto> {
    return this.getOrFail(id, requireOrganizationId(user));
  }

  @Patch(':id/complete')
  @ApiOkResponse({ type: CallResponseDto })
  async complete(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<CallResponseDto> {
    const organizationId = requireOrganizationId(user);
    return this.runTransition(
      id,
      organizationId,
      new CompleteCallCommand(id, organizationId),
      'Call: cannot complete from current status',
    );
  }

  @Patch(':id/miss')
  @ApiOkResponse({ type: CallResponseDto })
  async miss(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<CallResponseDto> {
    const organizationId = requireOrganizationId(user);
    return this.runTransition(
      id,
      organizationId,
      new MissCallCommand(id, organizationId),
      'Call: cannot mark missed from current status',
    );
  }

  private async runTransition(
    id: string,
    organizationId: string,
    command: CompleteCallCommand | MissCallCommand,
    badRequestMsg: string,
  ): Promise<CallResponseDto> {
    try {
      await this.commandBus.execute(command);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Call not found') throw new NotFoundException(e.message);
        if (e.message === badRequestMsg) throw new BadRequestException(e.message);
      }
      throw e;
    }
    return this.getOrFail(id, organizationId);
  }

  private async getOrFail(id: string, organizationId: string): Promise<CallResponseDto> {
    const call = await this.queryBus.execute(new GetCallQuery(id, organizationId));
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }
}
