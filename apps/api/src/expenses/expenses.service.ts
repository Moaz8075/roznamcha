import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { moneyStr } from '../common/money';
import { paginate } from '../common/response';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialTransactionService,
  ) {}

  async create(dto: CreateExpenseDto, userId: string) {
    const result = await this.financial.createExpense({
      expenseType: dto.expenseType,
      category: dto.category,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
      notes: dto.notes,
      createdById: userId,
    });

    return {
      ...this.map(result.expense),
      cashBalance: result.cashBalance,
    };
  }

  async findAll() {
    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where: { deletedAt: null },
        orderBy: { transactionDate: 'desc' },
        take: 500,
      }),
      this.prisma.expense.count({ where: { deletedAt: null } }),
    ]);
    return paginate(items.map((e) => this.map(e)), total);
  }

  private map(expense: {
    id: string;
    referenceNumber: string;
    expenseType: string;
    category: string;
    amount: { toString(): string };
    paymentMethod: string;
    transactionDate: Date;
    notes: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      id: expense.id,
      referenceNumber: expense.referenceNumber,
      expenseType: expense.expenseType,
      category: expense.category,
      amount: moneyStr(expense.amount.toString()),
      paymentMethod: expense.paymentMethod,
      transactionDate: expense.transactionDate.toISOString(),
      notes: expense.notes,
      createdBy: expense.createdById,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      deletedAt: expense.deletedAt?.toISOString() ?? null,
    };
  }
}
