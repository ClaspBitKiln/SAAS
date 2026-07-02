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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/infrastructure/current-user.decorator';
import { AccessTokenPayload } from '../../../auth/infrastructure/access-token.service';
import { requireOrganizationId } from '../../../auth/infrastructure/require-organization';
import {
  CreateRequestDto,
  ParseRequestDto,
  ParseRequestResponseDto,
  RequestListResponseDto,
  RequestResponseDto,
  UpdateRequestDto,
} from '../../application/dto/request.dto';
import {
  CreateRequestCommand,
  SearchRequestCommand,
  UpdateRequestCommand,
} from '../../application/commands/request.commands';
import { GetRequestQuery, ListRequestsQuery } from '../../application/queries/request.queries';
import { RequestParseService } from '../../application/services/request-parse.service';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly parseService: RequestParseService,
  ) {}

  @Post('parse')
  @ApiOkResponse({ type: ParseRequestResponseDto })
  async parseText(@Body() dto: ParseRequestDto): Promise<ParseRequestResponseDto> {
    return this.parseService.parseRawText(dto.rawText);
  }

  @Post('parse/file')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ type: ParseRequestResponseDto })
  async parseFile(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
  ): Promise<ParseRequestResponseDto> {
    if (!file) throw new BadRequestException('file required');
    return this.parseService.parseFileBuffer(file.buffer, file.mimetype, file.originalname);
  }

  @Post()
  @ApiOkResponse({ type: RequestResponseDto })
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateRequestDto,
  ): Promise<RequestResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      const { id } = await this.commandBus.execute(
        new CreateRequestCommand(
          organizationId,
          dto.contactId,
          dto.title,
          dto.notes,
          dto.source ?? RequestSourceEnum.MANUAL,
          dto.lines,
        ),
      );
      return this.getOrFail(id, organizationId);
    } catch (e) {
      if (e instanceof Error && (e.message === 'Organization not found' || e.message === 'Contact not found')) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: RequestListResponseDto })
  async list(
    @CurrentUser() user: AccessTokenPayload,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ): Promise<RequestListResponseDto> {
    const organizationId = requireOrganizationId(user);
    return this.queryBus.execute(
      new ListRequestsQuery(organizationId, Number(page), Math.min(Number(size), 100)),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: RequestResponseDto })
  async get(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<RequestResponseDto> {
    return this.getOrFail(id, requireOrganizationId(user));
  }

  @Patch(':id')
  @ApiOkResponse({ type: RequestResponseDto })
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ): Promise<RequestResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(
        new UpdateRequestCommand(id, organizationId, dto.contactId, dto.title, dto.notes, dto.lines),
      );
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'Request not found') throw new NotFoundException(e.message);
        if (e.message === 'Contact not found') throw new BadRequestException(e.message);
      }
      throw e;
    }
    return this.getOrFail(id, organizationId);
  }

  @Post(':id/search')
  @ApiOkResponse({ type: RequestResponseDto })
  async search(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string): Promise<RequestResponseDto> {
    const organizationId = requireOrganizationId(user);
    try {
      await this.commandBus.execute(new SearchRequestCommand(id, organizationId));
    } catch (e) {
      if (e instanceof Error && e.message === 'Request not found') throw new NotFoundException(e.message);
      throw e;
    }
    return this.getOrFail(id, organizationId);
  }

  private async getOrFail(id: string, organizationId: string): Promise<RequestResponseDto> {
    const request = await this.queryBus.execute(new GetRequestQuery(id, organizationId));
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }
}
