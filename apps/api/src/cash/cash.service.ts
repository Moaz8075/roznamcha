import { Injectable } from '@nestjs/common';
import { CashDirection } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { d, moneyStr } from '../common/money';
import { paginate } from '../common/response';

@Injectable()
export class CashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: FinancialTransactionService,
  ) {}

  async getBalance() {
    const balance = await this.transactions.getCashBalance();
    return { balance: moneyStr(balance) };
  }

  /**
   * Daily Roznamcha — derived from CashTransaction only.
   * Opening + Cash Received − Cash Paid = Closing
   */
  async getRoznamcha(date?: string) {
    let day: Date;
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, dayNum] = date.split('-').map(Number);
      day = new Date(y, m - 1, dayNum);
    } else {
      day = new Date();
    }
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const before = await this.prisma.cashTransaction.findFirst({
      where: { transactionDate: { lt: start } },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    });
    const openingCash = d(before?.balanceAfter.toString() ?? 0);

    const where = {
      transactionDate: { gte: start, lte: end },
    };

    const [items, total] = await Promise.all([
      this.prisma.cashTransaction.findMany({
        where,
        orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
        take: 500,
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);

    let cashReceived = d(0);
    let cashPaid = d(0);
    for (const row of items) {
      if (row.direction === CashDirection.IN) {
        cashReceived = cashReceived.plus(d(row.amount.toString()));
      } else {
        cashPaid = cashPaid.plus(d(row.amount.toString()));
      }
    }

    const closingCash = openingCash.plus(cashReceived).minus(cashPaid);

    const transactions = items.map((c) => ({
      id: c.id,
      referenceNumber: c.referenceNumber,
      type: c.type,
      direction: c.direction,
      amount: moneyStr(c.amount.toString()),
      balanceAfter: moneyStr(c.balanceAfter.toString()),
      paymentMethod: c.paymentMethod,
      transactionDate: c.transactionDate.toISOString(),
      description: c.description,
      saleId: c.saleId,
      purchaseId: c.purchaseId,
      paymentId: c.paymentId,
      expenseId: c.expenseId,
      createdBy: c.createdById,
      createdAt: c.createdAt.toISOString(),
    }));

    return {
      date: start.toISOString().slice(0, 10),
      openingCash: moneyStr(openingCash),
      cashReceived: moneyStr(cashReceived),
      cashPaid: moneyStr(cashPaid),
      closingCash: moneyStr(closingCash),
      ...paginate(transactions, total),
    };
  }
}
