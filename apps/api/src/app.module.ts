import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { PurchasesModule } from './purchases/purchases.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpensesModule } from './expenses/expenses.module';
import { LedgerModule } from './ledger/ledger.module';
import { CashModule } from './cash/cash.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    TransactionsModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,
    SalesModule,
    PurchasesModule,
    PaymentsModule,
    ExpensesModule,
    LedgerModule,
    CashModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
