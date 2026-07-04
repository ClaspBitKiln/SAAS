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
import { CreateTaskDto } from '../../application/dto/create-task.dto';
import { UpdateTaskDto } from '../../application/dto/update-task.dto';
import { TaskResponseDto } from '../../application/dto/task-response.dto';
import {
  CancelTaskCommand,
  CompleteTaskCommand,
  CreateTaskCommand,
  UpdateTaskCommand,
} from '../../application/commands/task.commands';
import { GetTaskQuery, ListTasksQuery, TodayTasksQuery } from '../../application/queries/task.queries';
import { TaskStatusEnum } from '../../domain/value-objects/task-enums';

const NOT_FOUND_MESSAGES = ['Task not found', 'Assignee not found', 'Contact not found', 'Company not found'];

function rethrow(e: unknown): never {
  if (e instanceof Error && NOT_FOUND_MESSAGES.includes(e.message)) throw new NotFoundException(e.message);
  if (e instanceof Error && e.message === 'Organization not found') throw new BadRequestException(e.message);
  if (e instanceof Error && e.message === 'Task is not open') throw new BadRequestException(e.message);
  if (e instanceof Error && e.message.startsWith('Task title')) throw new BadRequestException(e.message);
  throw e;
}

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: TaskResponseDto })
  async create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateTaskDto): Promise<TaskResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      const { id } = await this.commandBus.execute(
        new CreateTaskCommand(
          organizationId,
          dto.title,
          new Date(dto.dueAt),
          dto.type,
          dto.assigneeUserId,
          dto.contactId,
          dto.companyId,
          user.sub,
        ),
      );
      return this.getOrFail(id, organizationId);
    } catch (e) {
      rethrow(e);
    }
  }

  /** Open tasks of the current user due today or overdue. Declared before :id. */
  @Get('today')
  @ApiOkResponse({ type: TaskResponseDto, isArray: true })
  async today(@CurrentUser() user: AccessTokenPayload): Promise<TaskResponseDto[]> {
    const organizationId = requireOrganizationId(user);
    return this.queryBus.execute(new TodayTasksQuery(organizationId, user.sub));
  }

  @Get()
  @ApiOkResponse({ type: TaskResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('page') page = '1',
    @Query('size') size = '25',
    @Query('status') status?: string,
    @Query('assignee') assignee?: string,
    @Query('contactId') contactId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const organizationId = requireOrganizationId(user);
    const statusEnum =
      status && Object.values(TaskStatusEnum).includes(status as TaskStatusEnum)
        ? (status as TaskStatusEnum)
        : undefined;
    const assigneeUserId = assignee === 'me' ? user.sub : assignee;
    return this.queryBus.execute(
      new ListTasksQuery(
        organizationId,
        Number(page),
        Math.min(Number(size), 100),
        statusEnum,
        assigneeUserId,
        contactId,
        companyId,
      ),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: TaskResponseDto })
  async get(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<TaskResponseDto> {
    return this.getOrFail(id, requireOrganizationId(user));
  }

  @Patch(':id')
  @ApiOkResponse({ type: TaskResponseDto })
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(
        new UpdateTaskCommand(
          id,
          organizationId,
          dto.title,
          dto.dueAt ? new Date(dto.dueAt) : undefined,
          dto.type,
          dto.assigneeUserId,
          dto.contactId,
          dto.companyId,
        ),
      );
    } catch (e) {
      rethrow(e);
    }
    return this.getOrFail(id, organizationId);
  }

  @Patch(':id/complete')
  @ApiOkResponse({ type: TaskResponseDto })
  async complete(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<TaskResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(new CompleteTaskCommand(id, organizationId));
    } catch (e) {
      rethrow(e);
    }
    return this.getOrFail(id, organizationId);
  }

  @Patch(':id/cancel')
  @ApiOkResponse({ type: TaskResponseDto })
  async cancel(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<TaskResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(new CancelTaskCommand(id, organizationId));
    } catch (e) {
      rethrow(e);
    }
    return this.getOrFail(id, organizationId);
  }

  private async getOrFail(id: string, organizationId: string): Promise<TaskResponseDto> {
    const task = await this.queryBus.execute(new GetTaskQuery(id, organizationId));
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
