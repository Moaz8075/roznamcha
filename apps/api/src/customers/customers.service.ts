import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialTransactionService } from '../transactions/financial-transaction.service';
import { LedgerPartyType } from '../generated/prisma';
import { moneyStr } from '../common/money';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { paginate } from '../common/response';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financial: FinancialTransactionService,
  ) {}

  async create(dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        notes: dto.notes?.trim(),
      },
    });
    return this.map(customer, '0.0000');
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
      this.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 100,
      }),
      this.prisma.customer.count({ where }),
    ]);

    const withBalances = await Promise.all(
      items.map(async (c) => {
        const balance = await this.financial.getPartyBalance(
          LedgerPartyType.CUSTOMER,
          c.id,
        );
        return this.map(c, moneyStr(balance));
      }),
    );

    return paginate(withBalances, total);
  }

  async findOne(id: string) {
    const customer = await this.requireActive(id);
    const balance = await this.financial.getPartyBalance(
      LedgerPartyType.CUSTOMER,
      id,
    );
    return this.map(customer, moneyStr(balance));
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.requireActive(id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    const balance = await this.financial.getPartyBalance(
      LedgerPartyType.CUSTOMER,
      id,
    );
    return this.map(customer, moneyStr(balance));
  }

  async remove(id: string) {
    await this.requireActive(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id, deleted: true as const };
  }

  private async requireActive(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private map(
    c: {
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
  ) {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      notes: c.notes,
      balance,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
