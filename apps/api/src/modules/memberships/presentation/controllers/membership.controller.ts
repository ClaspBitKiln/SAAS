import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InviteMembershipDto } from '../../application/dto/invite-membership.dto';
import { ChangeMembershipRoleDto } from '../../application/dto/change-membership-role.dto';
import { MembershipResponseDto } from '../../application/dto/membership-response.dto';
import {
  AcceptMembershipCommand,
  ChangeMembershipRoleCommand,
  InviteMembershipCommand,
  RevokeMembershipCommand,
  SetDefaultMembershipCommand,
  SuspendMembershipCommand,
} from '../../application/commands/membership.commands';
import {
  GetMembershipQuery,
  ListMembershipsByOrganizationQuery,
  ListMembershipsByUserQuery,
} from '../../application/queries/membership.queries';

@ApiTags('memberships')
@Controller('memberships')
export class MembershipController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: MembershipResponseDto })
  async invite(@Body() dto: InviteMembershipDto): Promise<MembershipResponseDto> {
    try {
      const { id } = await this.commandBus.execute(
        new InviteMembershipCommand(
          dto.tenantId,
          dto.userId,
          dto.organizationId,
          dto.invitedBy,
          dto.roleId,
          dto.isDefault,
        ),
      );
      return this.getOrFail(id);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Membership already exists') throw new ConflictException(e.message);
        if (
          e.message === 'Tenant not found' ||
          e.message === 'User not found' ||
          e.message === 'Organization not found' ||
          e.message === 'Organization tenant mismatch'
        ) {
          throw new BadRequestException(e.message);
        }
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: MembershipResponseDto, isArray: true })
  async list(
    @Query('userId') userId: string | undefined,
    @Query('organizationId') organizationId: string | undefined,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ) {
    if (userId) {
      return this.queryBus.execute(
        new ListMembershipsByUserQuery(userId, Number(page), Math.min(Number(size), 100)),
      );
    }
    if (organizationId) {
      return this.queryBus.execute(
        new ListMembershipsByOrganizationQuery(organizationId, Number(page), Math.min(Number(size), 100)),
      );
    }
    throw new BadRequestException('userId or organizationId required');
  }

  @Get(':id')
  @ApiOkResponse({ type: MembershipResponseDto })
  async get(@Param('id') id: string): Promise<MembershipResponseDto> {
    return this.getOrFail(id);
  }

  @Patch(':id/accept')
  @ApiOkResponse({ type: MembershipResponseDto })
  async accept(@Param('id') id: string): Promise<MembershipResponseDto> {
    return this.runStateChange(id, new AcceptMembershipCommand(id), 'Membership: cannot accept from current status');
  }

  @Patch(':id/suspend')
  @ApiOkResponse({ type: MembershipResponseDto })
  async suspend(@Param('id') id: string): Promise<MembershipResponseDto> {
    return this.runStateChange(id, new SuspendMembershipCommand(id), 'Membership: cannot suspend from current status');
  }

  @Patch(':id/revoke')
  @ApiOkResponse({ type: MembershipResponseDto })
  async revoke(@Param('id') id: string): Promise<MembershipResponseDto> {
    return this.runStateChange(id, new RevokeMembershipCommand(id), 'Membership: already revoked');
  }

  @Patch(':id/default')
  @ApiOkResponse({ type: MembershipResponseDto })
  async setDefault(@Param('id') id: string): Promise<MembershipResponseDto> {
    return this.runStateChange(id, new SetDefaultMembershipCommand(id));
  }

  @Patch(':id/role')
  @ApiOkResponse({ type: MembershipResponseDto })
  async changeRole(@Param('id') id: string, @Body() dto: ChangeMembershipRoleDto): Promise<MembershipResponseDto> {
    return this.runStateChange(id, new ChangeMembershipRoleCommand(id, dto.roleId ?? null));
  }

  private async runStateChange(
    id: string,
    command: AcceptMembershipCommand | SuspendMembershipCommand | RevokeMembershipCommand | SetDefaultMembershipCommand | ChangeMembershipRoleCommand,
    badRequestMsg?: string,
  ): Promise<MembershipResponseDto> {
    try {
      await this.commandBus.execute(command);
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Membership not found') throw new NotFoundException(e.message);
        if (badRequestMsg && e.message === badRequestMsg) throw new BadRequestException(e.message);
      }
      throw e;
    }
    return this.getOrFail(id);
  }

  private async getOrFail(id: string): Promise<MembershipResponseDto> {
    const m = await this.queryBus.execute(new GetMembershipQuery(id));
    if (!m) throw new NotFoundException('Membership not found');
    return m;
  }
}
