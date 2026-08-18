import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { LedgerPartyType } from '../generated/prisma';
import { moneyStr } from '../common/money';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { paginate } from '../common/response';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialTransactionService,
  ) {}

  async create(dto: CreateSupplierDto) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        notes: dto.notes?.trim(),
      },
    });
    return this.map(supplier, '0.0000', '0.0000');
  }

  async findAll(q?: string) {
    const where = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 100,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const withBalances = await Promise.all(
      items.map(async (s) => {
        const balance = await this.financial.getPartyBalance(
          LedgerPartyType.SUPPLIER,
          s.id,
        );
        return this.map(s, moneyStr(balance), '0.0000');
      }),
    );

    if (items.length) {
      const purchaseSums = await this.prisma.purchase.groupBy({
        by: ['supplierId'],
        where: { deletedAt: null, supplierId: { in: items.map((s) => s.id) } },
        _sum: { total: true },
      });
      const bySupplier = new Map(
        purchaseSums.map((row) => [row.supplierId, moneyStr(row._sum.total?.toString() ?? 0)]),
      );
      for (const row of withBalances) {
        row.purchaseTotal = bySupplier.get(row.id) ?? '0.0000';
      }
    }

    return paginate(withBalances, total);
  }

  async findOne(id: string) {
    const supplier = await this.requireActive(id);
    const [balance, purchaseTotal] = await Promise.all([
      this.financial.getPartyBalance(LedgerPartyType.SUPPLIER, id),
      this.sumPurchases(id),
    ]);
    return this.map(supplier, moneyStr(balance), purchaseTotal);
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.requireActive(id);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    const [balance, purchaseTotal] = await Promise.all([
      this.financial.getPartyBalance(LedgerPartyType.SUPPLIER, id),
      this.sumPurchases(id),
    ]);
    return this.map(supplier, moneyStr(balance), purchaseTotal);
  }

  async remove(id: string) {
    await this.requireActive(id);
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id, deleted: true as const };
  }

  private async requireActive(id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  private async sumPurchases(supplierId: string) {
    const agg = await this.prisma.purchase.aggregate({
      where: { supplierId, deletedAt: null },
      _sum: { total: true },
    });
    return moneyStr(agg._sum.total?.toString() ?? 0);
  }

  private map(
    s: {
      id: string;
      name: string;
      phone: string | null;
      address: string | null;
      notes: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
    balance: string,
    purchaseTotal = '0.0000',
  ) {
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      notes: s.notes,
      balance,
      purchaseTotal,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
