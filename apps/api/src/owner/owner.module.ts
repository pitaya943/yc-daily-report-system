import { Module } from '@nestjs/common';
import {
  AdminAdminsController,
  OwnerAdminsController,
} from './owner-admins.controller';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [OwnerAdminsController, AdminAdminsController],
})
export class OwnerModule {}
