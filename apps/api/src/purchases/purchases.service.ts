import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { moneyStr } from '../common/money';
import { paginate } from '../common/response';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialTransactionService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: string) {
    const result = await this.financial.createPurchase({
      supplierId: dto.supplierId,
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
      ...this.map(result.purchase),
      supplierBalance: result.supplierBalance,
      cashBalance: result.cashBalance,
    };
  }

  async findAll() {
    const [items, total] = await Promise.all([
      this.prisma.purchase.findMany({
        where: { deletedAt: null },
        include: { items: true, supplier: true },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      }),
      this.prisma.purchase.count({ where: { deletedAt: null } }),
    ]);
    return paginate(items.map((p) => this.map(p)), total);
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: { id, deletedAt: null },
      include: { items: true, supplier: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return this.map(purchase);
  }

  private map(purchase: {
    id: string;
    referenceNumber: string;
    supplierId: string;
    transactionDate: Date;
    subtotal: { toString(): string };
    discount: { toString(): string };
    total: { toString(): string };
    paidAmount: { toString(): string };
    creditAmount: { toString(): string };
    paymentMethod: string;
    description: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    supplier?: { name: string };
    items?: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: { toString(): string };
      unitPrice: { toString(): string };
      lineTotal: { toString(): string };
    }>;
  }) {
    return {
      id: purchase.id,
      referenceNumber: purchase.referenceNumber,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplier?.name ?? '',
      transactionDate: purchase.transactionDate.toISOString(),
      subtotal: moneyStr(purchase.subtotal.toString()),
      discount: moneyStr(purchase.discount.toString()),
      total: moneyStr(purchase.total.toString()),
      paidAmount: moneyStr(purchase.paidAmount.toString()),
      creditAmount: moneyStr(purchase.creditAmount.toString()),
      paymentMethod: purchase.paymentMethod,
      description: purchase.description,
      items: (purchase.items ?? []).map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: moneyStr(i.quantity.toString()),
        unitPrice: moneyStr(i.unitPrice.toString()),
        lineTotal: moneyStr(i.lineTotal.toString()),
      })),
      createdBy: purchase.createdById,
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
      deletedAt: purchase.deletedAt?.toISOString() ?? null,
    };
  }
}
