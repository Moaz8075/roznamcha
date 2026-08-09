import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { moneyStr } from '../common/money';
import { paginate } from '../common/response';

type LedgerRow = {
  id: string;
  referenceNumber: string;
  partyType: string;
  customerId: string | null;
  supplierId: string | null;
  entryType: string;
  debit: { toString(): string };
  credit: { toString(): string };
  balanceAfter: { toString(): string };
  transactionDate: Date;
  description: string | null;
  saleId: string | null;
  purchaseId: string | null;
  paymentId: string | null;
  createdById: string;
  createdAt: Date;
  sale: {
    items: { productName: string; quantity: { toString(): string } }[];
  } | null;
  purchase: {
    items: { productName: string; quantity: { toString(): string } }[];
  } | null;
};

const ledgerInclude = {
  sale: { include: { items: true } },
  purchase: { include: { items: true } },
} as const;

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async customerStatement(customerId: string) {
    const [items, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { customerId },
        include: ledgerInclude,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        take: 200,
      }),
      this.prisma.ledgerEntry.count({ where: { customerId } }),
    ]);
    return paginate(
      items.map((e) => this.map(e)),
      total,
    );
  }

  async supplierStatement(supplierId: string) {
    const [items, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { supplierId },
        include: ledgerInclude,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        take: 200,
      }),
      this.prisma.ledgerEntry.count({ where: { supplierId } }),
    ]);
    return paginate(
      items.map((e) => this.map(e)),
      total,
    );
  }

  private map(e: LedgerRow) {
    const items = e.sale?.items ?? e.purchase?.items ?? [];
    const detailLines = items.map((item) => {
      const qty = Number(item.quantity.toString());
      const qtyLabel = Number.isFinite(qty) ? String(qty) : item.quantity.toString();
      return `${item.productName} × ${qtyLabel}`;
    });

    return {
      id: e.id,
      referenceNumber: e.referenceNumber,
      partyType: e.partyType,
      customerId: e.customerId,
      supplierId: e.supplierId,
      entryType: e.entryType,
      debit: moneyStr(e.debit.toString()),
      credit: moneyStr(e.credit.toString()),
      balanceAfter: moneyStr(e.balanceAfter.toString()),
      transactionDate: e.transactionDate.toISOString(),
      description: e.description,
      detailLines,
      itemCount: items.length,
      saleId: e.saleId,
      purchaseId: e.purchaseId,
      paymentId: e.paymentId,
      createdBy: e.createdById,
      createdAt: e.createdAt.toISOString(),
    };
  }
}
