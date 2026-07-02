import { Module } from '@nestjs/common';
import { PlatformModule } from '../modules/platform/platform.module';
import { UsersModule } from '../modules/users/users.module';
import { MembershipsModule } from '../modules/memberships/memberships.module';
import { ContactsModule } from '../modules/contacts/contacts.module';
import { CallsModule } from '../modules/calls/calls.module';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [PlatformModule, UsersModule, MembershipsModule, ContactsModule, CallsModule, AuthModule],
})
export class AppModule {}
