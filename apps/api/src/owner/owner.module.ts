import { Module } from '@nestjs/common';
import { OwnerAdminsController } from './owner-admins.controller';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [OwnerAdminsController],
})
export class OwnerModule {}
