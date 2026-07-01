import { Body, Controller, Get, Param, Patch, Post, NotFoundException, Query, BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrganizationDto } from '../../application/dto/create-organization.dto';
import { UpdateOrganizationDto } from '../../application/dto/update-organization.dto';
import { OrganizationResponseDto } from '../../application/dto/organization-response.dto';
import { CreateOrganizationCommand, UpdateOrganizationCommand } from '../../application/commands/organization.commands';
import { GetOrganizationQuery, ListOrganizationsQuery } from '../../application/queries/organization.queries';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: OrganizationResponseDto })
  async create(@Body() dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    try {
      const { id } = await this.commandBus.execute(
        new CreateOrganizationCommand(dto.tenantId, dto.name, dto.inn, dto.settings),
      );
      return this.getOrFail(id);
    } catch (e) {
      if (e instanceof Error && e.message === 'Tenant не найден') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: OrganizationResponseDto })
  async get(@Param('id') id: string): Promise<OrganizationResponseDto> {
    return this.getOrFail(id);
  }

  @Get()
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  async list(
    @Query('tenantId') tenantId: string,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ) {
    if (!tenantId) throw new BadRequestException('tenantId обязателен');
    return this.queryBus.execute(
      new ListOrganizationsQuery(tenantId, Number(page), Math.min(Number(size), 100)),
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: OrganizationResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto): Promise<OrganizationResponseDto> {
    try {
      await this.commandBus.execute(new UpdateOrganizationCommand(id, dto.name, dto.inn, dto.settings));
    } catch (e) {
      if (e instanceof Error && e.message === 'Organization не найдена') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
    return this.getOrFail(id);
  }

  private async getOrFail(id: string): Promise<OrganizationResponseDto> {
    const org = await this.queryBus.execute(new GetOrganizationQuery(id));
    if (!org) throw new NotFoundException('Organization не найдена');
    return org;
  }
}
