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
  async start(@Body() dto: StartCallDto): Promise<CallResponseDto> {
    try {
      const { id } = await this.commandBus.execute(
        new StartCallCommand(dto.contactId, dto.direction, dto.phone),
      );
      return this.getOrFail(id);
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
    @Query('contactId') contactId: string | undefined,
    @Query('organizationId') organizationId: string | undefined,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ) {
    if (contactId) {
      return this.queryBus.execute(
        new ListCallsByContactQuery(contactId, Number(page), Math.min(Number(size), 100)),
      );
    }
    if (organizationId) {
      return this.queryBus.execute(
        new ListCallsByOrganizationQuery(organizationId, Number(page), Math.min(Number(size), 100)),
      );
    }
    throw new BadRequestException('contactId or organizationId required');
  }

  @Get(':id')
  @ApiOkResponse({ type: CallResponseDto })
  async get(@Param('id') id: string): Promise<CallResponseDto> {
    return this.getOrFail(id);
  }

  @Patch(':id/complete')
  @ApiOkResponse({ type: CallResponseDto })
  async complete(@Param('id') id: string): Promise<CallResponseDto> {
    return this.runTransition(id, new CompleteCallCommand(id), 'Call: cannot complete from current status');
  }

  @Patch(':id/miss')
  @ApiOkResponse({ type: CallResponseDto })
  async miss(@Param('id') id: string): Promise<CallResponseDto> {
    return this.runTransition(id, new MissCallCommand(id), 'Call: cannot mark missed from current status');
  }

  private async runTransition(
    id: string,
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
    return this.getOrFail(id);
  }

  private async getOrFail(id: string): Promise<CallResponseDto> {
    const call = await this.queryBus.execute(new GetCallQuery(id));
    if (!call) throw new NotFoundException('Call not found');
    return call;
  }
}
