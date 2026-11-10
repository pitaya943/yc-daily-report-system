import { Module } from '@nestjs/common';
import { ConfirmationController } from './confirmation.controller';
import { ConfirmationService } from './confirmation.service';

@Module({
  controllers: [ConfirmationController],
  providers: [ConfirmationService],
})
export class ConfirmationModule {}
