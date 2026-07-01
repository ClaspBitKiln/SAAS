import { Module } from '@nestjs/common';
import { PlatformModule } from '../modules/platform/platform.module';
import { UsersModule } from '../modules/users/users.module';
import { MembershipsModule } from '../modules/memberships/memberships.module';
import { ContactsModule } from '../modules/contacts/contacts.module';

@Module({
  imports: [PlatformModule, UsersModule, MembershipsModule, ContactsModule],
})
export class AppModule {}
