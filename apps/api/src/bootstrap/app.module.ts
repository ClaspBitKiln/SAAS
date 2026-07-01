import { Module } from '@nestjs/common';
import { PlatformModule } from '../modules/platform/platform.module';
import { UsersModule } from '../modules/users/users.module';
import { MembershipsModule } from '../modules/memberships/memberships.module';

@Module({
  imports: [PlatformModule, UsersModule, MembershipsModule],
})
export class AppModule {}
