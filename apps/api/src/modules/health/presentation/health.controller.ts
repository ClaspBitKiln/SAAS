import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/infrastructure/public.decorator';
import { HEALTH_REPOSITORY, HealthRepository } from '../domain/health.repository';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(@Inject(HEALTH_REPOSITORY) private readonly healthRepo: HealthRepository) {}

  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok', database: 'up' } } })
  async check(): Promise<{ status: string; database: string }> {
    await this.healthRepo.pingDatabase();
    return { status: 'ok', database: 'up' };
  }
}
