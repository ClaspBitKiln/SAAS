import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto, SetPasswordDto } from '../../application/dto/auth.dto';
import { LoginResponseDto } from '../../application/dto/login-response.dto';
import { LoginCommand, SetPasswordCommand } from '../../application/commands/auth.commands';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('set-password')
  @HttpCode(204)
  async setPassword(@Body() dto: SetPasswordDto): Promise<void> {
    try {
      await this.commandBus.execute(new SetPasswordCommand(dto.userId, dto.password));
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'User not found') throw new NotFoundException(e.message);
        if (e.message === 'User is disabled') throw new BadRequestException(e.message);
        if (e.message.startsWith('Password:')) throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Post('login')
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.commandBus.execute(new LoginCommand(dto.email, dto.password));
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      if (e instanceof Error && e.message.startsWith('Password:')) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
