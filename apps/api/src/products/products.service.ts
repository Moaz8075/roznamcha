import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { moneyStr, d } from '../common/money';
import { paginate } from '../common/response';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const salePrice = d(dto.salePrice ?? '0');
    const purchasePrice = d(dto.purchasePrice ?? '0');
    if (salePrice.lt(0) || purchasePrice.lt(0)) {
      throw new BadRequestException('Price cannot be negative');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        unit: dto.unit?.trim() || 'cft',
        salePrice: new Prisma.Decimal(moneyStr(salePrice)),
        purchasePrice: new Prisma.Decimal(moneyStr(purchasePrice)),
      },
    });

    return this.map(product);
  }

  async findAll(q?: string) {
    const where = {
      deletedAt: null,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, take: 100 }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(items.map((p) => this.map(p)), total);
  }

  async findOne(id: string) {
    return this.map(await this.requireActive(id));
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.requireActive(id);

    if (dto.salePrice !== undefined && d(dto.salePrice).lt(0)) {
      throw new BadRequestException('Price cannot be negative');
    }
    if (dto.purchasePrice !== undefined && d(dto.purchasePrice).lt(0)) {
      throw new BadRequestException('Price cannot be negative');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit.trim() } : {}),
        ...(dto.salePrice !== undefined
          ? { salePrice: new Prisma.Decimal(moneyStr(d(dto.salePrice))) }
          : {}),
        ...(dto.purchasePrice !== undefined
          ? { purchasePrice: new Prisma.Decimal(moneyStr(d(dto.purchasePrice))) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return this.map(product);
  }

  async remove(id: string) {
    await this.requireActive(id);
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { id, deleted: true as const };
  }

  private async requireActive(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private map(p: {
    id: string;
    name: string;
    unit: string;
    salePrice: Prisma.Decimal;
    purchasePrice: Prisma.Decimal;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: p.id,
      name: p.name,
      unit: p.unit,
      salePrice: moneyStr(p.salePrice.toString()),
      purchasePrice: moneyStr(p.purchasePrice.toString()),
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
