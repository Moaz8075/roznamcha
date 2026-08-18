import { Injectable } from '@nestjs/common';
import { CashDirection, LedgerPartyType } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { d, moneyStr } from '../common/money';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: FinancialTransactionService,
  ) {}

  async summary() {
    const cashBalance = await this.transactions.getCashBalance();

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayCash = await this.prisma.cashTransaction.groupBy({
      by: ['direction'],
      where: { transactionDate: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const todayCashIn = d(
      todayCash.find((r) => r.direction === CashDirection.IN)?._sum.amount?.toString() ?? 0,
    );
    const todayCashOut = d(
      todayCash.find((r) => r.direction === CashDirection.OUT)?._sum.amount?.toString() ?? 0,
    );

    const [todaySalesAgg, todayPurchasesAgg, todayExpensesAgg, allSalesAgg, allPurchasesAgg, allExpensesAgg] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: { deletedAt: null, transactionDate: { gte: start, lte: end } },
          _sum: { total: true },
        }),
        this.prisma.purchase.aggregate({
          where: { deletedAt: null, transactionDate: { gte: start, lte: end } },
          _sum: { total: true },
        }),
        this.prisma.expense.aggregate({
          where: { deletedAt: null, transactionDate: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.sale.aggregate({
          where: { deletedAt: null },
          _sum: { total: true },
        }),
        this.prisma.purchase.aggregate({
          where: { deletedAt: null },
          _sum: { total: true },
        }),
        this.prisma.expense.aggregate({
          where: { deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

    const todaySales = d(todaySalesAgg._sum.total?.toString() ?? 0);
    const todayPurchases = d(todayPurchasesAgg._sum.total?.toString() ?? 0);
    const todayExpenses = d(todayExpensesAgg._sum.amount?.toString() ?? 0);
    const todayProfit = todaySales.minus(todayPurchases).minus(todayExpenses);

    const totalSales = d(allSalesAgg._sum.total?.toString() ?? 0);
    const totalPurchases = d(allPurchasesAgg._sum.total?.toString() ?? 0);
    const totalExpenses = d(allExpensesAgg._sum.amount?.toString() ?? 0);
    const netProfit = totalSales.minus(totalPurchases).minus(totalExpenses);

    const customers = await this.prisma.customer.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    let customerOutstanding = d(0);
    for (const c of customers) {
      const bal = await this.transactions.getPartyBalance(LedgerPartyType.CUSTOMER, c.id);
      if (bal.gt(0)) customerOutstanding = customerOutstanding.plus(bal);
    }

    const suppliers = await this.prisma.supplier.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    let supplierOutstanding = d(0);
    for (const s of suppliers) {
      const bal = await this.transactions.getPartyBalance(LedgerPartyType.SUPPLIER, s.id);
      if (bal.gt(0)) supplierOutstanding = supplierOutstanding.plus(bal);
    }

    return {
      cashBalance: moneyStr(cashBalance),
      todayCashIn: moneyStr(todayCashIn),
      todayCashOut: moneyStr(todayCashOut),
      customerOutstanding: moneyStr(customerOutstanding),
      supplierOutstanding: moneyStr(supplierOutstanding),
      todaySales: moneyStr(todaySales),
      todayPurchases: moneyStr(todayPurchases),
      todayExpenses: moneyStr(todayExpenses),
      todayProfit: moneyStr(todayProfit),
      totalSales: moneyStr(totalSales),
      totalPurchases: moneyStr(totalPurchases),
      totalExpenses: moneyStr(totalExpenses),
      netProfit: moneyStr(netProfit),
    };
  }
}
