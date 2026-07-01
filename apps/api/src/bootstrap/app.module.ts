import { Module } from '@nestjs/common';
import { PlatformModule } from '../modules/platform/platform.module';
import { UsersModule } from '../modules/users/users.module';

// Корневой модуль монолита. Контексты подключаются как модули (ADR-004).
// По мере готовности добавляются: AuthModule, RbacModule, CrmModule, ...
@Module({
  imports: [PlatformModule, UsersModule],
})
export class AppModule {}
