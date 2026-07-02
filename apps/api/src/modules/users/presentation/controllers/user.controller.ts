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
  ConflictException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/public.decorator';
import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import {
  ActivateUserCommand,
  CreateUserCommand,
  DisableUserCommand,
  UpdateUserCommand,
} from '../../application/commands/user.commands';
import { GetUserByEmailQuery, GetUserQuery, ListUsersQuery } from '../../application/queries/user.queries';

@ApiTags('users')
@Public()
@Controller('users')
export class UserController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  @ApiOkResponse({ type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const { id } = await this.commandBus.execute(
        new CreateUserCommand(dto.email, dto.name, dto.avatarUrl, dto.locale, dto.timezone),
      );
      return this.getOrFail(id);
    } catch (e) {
      if (e instanceof Error && e.message === 'User email already exists') {
        throw new ConflictException(e.message);
      }
      throw e;
    }
  }

  @Get()
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async listOrByEmail(
    @Query('email') email: string | undefined,
    @Query('page') page = '1',
    @Query('size') size = '25',
  ) {
    if (email) {
      const user = await this.queryBus.execute(new GetUserByEmailQuery(email));
      if (!user) throw new NotFoundException('User not found');
      return user;
    }
    return this.queryBus.execute(new ListUsersQuery(Number(page), Math.min(Number(size), 100)));
  }

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async get(@Param('id') id: string): Promise<UserResponseDto> {
    return this.getOrFail(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    try {
      await this.commandBus.execute(
        new UpdateUserCommand(id, dto.name, dto.avatarUrl, dto.locale, dto.timezone),
      );
    } catch (e) {
      if (e instanceof Error && e.message === 'User not found') {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
    return this.getOrFail(id);
  }

  @Patch(':id/activate')
  @ApiOkResponse({ type: UserResponseDto })
  async activate(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      await this.commandBus.execute(new ActivateUserCommand(id));
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'User not found') throw new NotFoundException(e.message);
        if (e.message === 'User: cannot activate from current status') {
          throw new BadRequestException(e.message);
        }
      }
      throw e;
    }
    return this.getOrFail(id);
  }

  @Patch(':id/disable')
  @ApiOkResponse({ type: UserResponseDto })
  async disableInline(@Param('id') id: string): Promise<UserResponseDto> {
    try {
      await this.commandBus.execute(new DisableUserCommand(id));
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'User not found') throw new NotFoundException(e.message);
        if (e.message === 'User: already disabled') throw new BadRequestException(e.message);
      }
      throw e;
    }
    return this.getOrFail(id);
  }

  private async getOrFail(id: string): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(new GetUserQuery(id));
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
