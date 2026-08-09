import { Global, Module } from '@nestjs/common';
import { FinancialTransactionService } from './financial-transaction.service';

@Global()
@Module({
  providers: [FinancialTransactionService],
  exports: [FinancialTransactionService],
})
export class TransactionsModule {}
