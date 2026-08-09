import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { moneyStr } from '../common/money';
import { paginate } from '../common/response';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialTransactionService,
  ) {}

  async create(dto: CreatePaymentDto, userId: string) {
    const result = await this.financial.createPayment({
      direction: dto.direction,
      customerId: dto.customerId,
      supplierId: dto.supplierId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
      notes: dto.notes,
      createdById: userId,
    });

    return {
      ...this.map(result.payment),
      customerBalance: result.customerBalance,
      supplierBalance: result.supplierBalance,
      cashBalance: result.cashBalance,
    };
  }

  async findAll() {
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { deletedAt: null },
        include: { customer: true, supplier: true },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      }),
      this.prisma.payment.count({ where: { deletedAt: null } }),
    ]);
    return paginate(items.map((p) => this.map(p)), total);
  }

  private map(payment: {
    id: string;
    referenceNumber: string;
    direction: string;
    customerId: string | null;
    supplierId: string | null;
    amount: { toString(): string };
    paymentMethod: string;
    transactionDate: Date;
    notes: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    customer?: { name: string } | null;
    supplier?: { name: string } | null;
  }) {
    return {
      id: payment.id,
      referenceNumber: payment.referenceNumber,
      direction: payment.direction,
      customerId: payment.customerId,
      supplierId: payment.supplierId,
      partyName: payment.customer?.name ?? payment.supplier?.name ?? '',
      amount: moneyStr(payment.amount.toString()),
      paymentMethod: payment.paymentMethod,
      transactionDate: payment.transactionDate.toISOString(),
      notes: payment.notes,
      createdBy: payment.createdById,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      deletedAt: payment.deletedAt?.toISOString() ?? null,
    };
  }
}
