import { Body, Controller, Get, Param, Patch, Post, NotFoundException, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateTenantDto } from '../../application/dto/create-tenant.dto';
import { TenantResponseDto } from '../../application/dto/tenant-response.dto';
import { CreateTenantCommand, ActivateTenantCommand, SuspendTenantCommand } from '../../application/commands/tenant.commands';
import { GetTenantQuery, ListTenantsQuery } from '../../application/queries/tenant.queries';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: TenantResponseDto })
  async create(@Body() dto: CreateTenantDto): Promise<TenantResponseDto> {
    const { id } = await this.commandBus.execute(new CreateTenantCommand(dto.name, dto.slug, dto.plan));
    return this.getOrFail(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: TenantResponseDto })
  async get(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.getOrFail(id);
  }

  @Get()
  @ApiOkResponse({ type: TenantResponseDto, isArray: true })
  async list(@Query('page') page = '1', @Query('size') size = '25') {
    return this.queryBus.execute(new ListTenantsQuery(Number(page), Math.min(Number(size), 100)));
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string): Promise<TenantResponseDto> {
    await this.commandBus.execute(new ActivateTenantCommand(id));
    return this.getOrFail(id);
  }

  @Patch(':id/suspend')
  async suspend(@Param('id') id: string): Promise<TenantResponseDto> {
    await this.commandBus.execute(new SuspendTenantCommand(id));
    return this.getOrFail(id);
  }

  private async getOrFail(id: string): Promise<TenantResponseDto> {
    const t = await this.queryBus.execute(new GetTenantQuery(id));
    if (!t) throw new NotFoundException('Tenant не найден');
    return t;
  }
}
