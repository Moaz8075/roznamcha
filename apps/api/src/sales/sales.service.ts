import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { moneyStr } from '../common/money';
import { paginate } from '../common/response';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialTransactionService,
  ) {}

  async create(dto: CreateSaleDto, userId: string) {
    const result = await this.financial.createSale({
      customerId: dto.customerId,
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
      discount: dto.discount,
      paidAmount: dto.paidAmount,
      creditAmount: dto.creditAmount,
      paymentMethod: dto.paymentMethod,
      description: dto.description,
      items: dto.items,
      createdById: userId,
    });

    return {
      ...this.map(result.sale),
      customerBalance: result.customerBalance,
      cashBalance: result.cashBalance,
    };
  }

  async findAll() {
    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where: { deletedAt: null },
        include: { items: true, customer: true },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      }),
      this.prisma.sale.count({ where: { deletedAt: null } }),
    ]);
    return paginate(items.map((s) => this.map(s)), total);
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: { items: true, customer: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return this.map(sale);
  }

  private map(sale: {
    id: string;
    referenceNumber: string;
    customerId: string;
    transactionDate: Date;
    subtotal: { toString(): string };
    discount: { toString(): string };
    total: { toString(): string };
    paidAmount: { toString(): string };
    creditAmount: { toString(): string };
    paymentMethod: string;
    profit: { toString(): string };
    description: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    customer?: { name: string };
    items?: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: { toString(): string };
      unitPrice: { toString(): string };
      costPrice: { toString(): string };
      lineTotal: { toString(): string };
      lineProfit: { toString(): string };
    }>;
  }) {
    return {
      id: sale.id,
      referenceNumber: sale.referenceNumber,
      customerId: sale.customerId,
      customerName: sale.customer?.name ?? '',
      transactionDate: sale.transactionDate.toISOString(),
      subtotal: moneyStr(sale.subtotal.toString()),
      discount: moneyStr(sale.discount.toString()),
      total: moneyStr(sale.total.toString()),
      paidAmount: moneyStr(sale.paidAmount.toString()),
      creditAmount: moneyStr(sale.creditAmount.toString()),
      paymentMethod: sale.paymentMethod,
      profit: moneyStr(sale.profit.toString()),
      description: sale.description,
      items: (sale.items ?? []).map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: moneyStr(i.quantity.toString()),
        unitPrice: moneyStr(i.unitPrice.toString()),
        costPrice: moneyStr(i.costPrice.toString()),
        lineTotal: moneyStr(i.lineTotal.toString()),
        lineProfit: moneyStr(i.lineProfit.toString()),
      })),
      createdBy: sale.createdById,
      createdAt: sale.createdAt.toISOString(),
      updatedAt: sale.updatedAt.toISOString(),
      deletedAt: sale.deletedAt?.toISOString() ?? null,
    };
  }
}
