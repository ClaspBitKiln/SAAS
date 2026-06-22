import { Module } from '@nestjs/common';
import { PlatformModule } from '../modules/platform/platform.module';

// Корневой модуль монолита. Контексты подключаются как модули (ADR-004).
// По мере готовности добавляются: AuthModule, UsersModule, RbacModule, CrmModule, ...
@Module({
  imports: [PlatformModule],
})
export class AppModule {}
