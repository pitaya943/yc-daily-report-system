import { Global, Module } from '@nestjs/common';
import { BankService } from './bank.service';

@Global()
@Module({
  providers: [BankService],
  exports: [BankService],
})
export class BankModule {}
