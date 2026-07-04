import {
  BadGatewayException,
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
import { CreateCompanyDto } from '../../application/dto/create-company.dto';
import { UpdateCompanyDto } from '../../application/dto/update-company.dto';
import { CompanyResponseDto } from '../../application/dto/company-response.dto';
import {
  CreateCompanyCommand,
  DeleteCompanyCommand,
  UpdateCompanyCommand,
} from '../../application/commands/company.commands';
import { GetCompanyQuery, ListCompaniesQuery } from '../../application/queries/company.queries';
import { InnLookupService } from '../../infrastructure/inn-lookup.service';
import { InnLookupResponseDto } from '../../application/dto/inn-lookup-response.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly innLookup: InnLookupService,
  ) {}

  /** EGRUL lookup by INN (self-filling). Declared before :id route on purpose. */
  @Get('inn-lookup/:inn')
  @ApiOkResponse({ type: InnLookupResponseDto })
  async lookupByInn(@Param('inn') inn: string): Promise<InnLookupResponseDto> {
    if (!/^\d{10}$|^\d{12}$/.test(inn)) {
      throw new BadRequestException('INN must be 10 or 12 digits');
    }
    try {
      return await this.innLookup.lookup(inn);
    } catch {
      throw new BadGatewayException('INN lookup failed');
    }
  }

  @Post()
  @ApiOkResponse({ type: CompanyResponseDto })
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      const { id } = await this.commandBus.execute(
        new CreateCompanyCommand(
          organizationId,
          dto.name,
          dto.inn,
          dto.website,
          dto.phone,
          dto.email,
          dto.ownerUserId,
          user.sub,
        ),
      );
      return this.getOrFail(id, organizationId);
    } catch (e) {
      if (e instanceof Error && e.message === 'Organization not found') {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error && e.message === 'Owner not found') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: CompanyResponseDto, isArray: true })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('page') page = '1',
    @Query('size') size = '25',
    @Query('q') q?: string,
  ) {
    const organizationId = requireOrganizationId(user);
    return this.queryBus.execute(
      new ListCompaniesQuery(organizationId, Number(page), Math.min(Number(size), 100), q),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: CompanyResponseDto })
  async get(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<CompanyResponseDto> {
    return this.getOrFail(id, requireOrganizationId(user));
  }

  @Patch(':id')
  @ApiOkResponse({ type: CompanyResponseDto })
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(
        new UpdateCompanyCommand(
          id,
          organizationId,
          dto.name,
          dto.inn,
          dto.website,
          dto.phone,
          dto.email,
          dto.ownerUserId,
        ),
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'Company not found') throw new NotFoundException(e.message);
      if (e instanceof Error && e.message === 'Owner not found') throw new NotFoundException(e.message);
      throw e;
    }
    return this.getOrFail(id, organizationId);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<void> {
    try {
      await this.commandBus.execute(new DeleteCompanyCommand(id, requireOrganizationId(user)));
    } catch (e) {
      if (e instanceof Error && e.message === 'Company not found') throw new NotFoundException(e.message);
      throw e;
    }
  }

  private async getOrFail(id: string, organizationId: string): Promise<CompanyResponseDto> {
    const company = await this.queryBus.execute(new GetCompanyQuery(id, organizationId));
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }
}
