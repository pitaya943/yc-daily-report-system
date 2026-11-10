import { Module } from '@nestjs/common';
import {
  AdminAdminsController,
  OwnerAdminsController,
} from './owner-admins.controller';

@Module({
  controllers: [OwnerAdminsController, AdminAdminsController],
})
export class OwnerModule {}
