import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashDirection,
  CashTransactionType,
  ExpenseCategory,
  ExpenseType,
  LedgerEntryType,
  LedgerPartyType,
  PaymentDirection,
  PaymentMethod,
  Prisma,
} from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { assertPositiveMoney, d, moneyStr } from '../common/money';
import { buildReference } from '../common/reference';

export interface SaleItemInput {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export interface CreateSaleInput {
  customerId: string;
  transactionDate?: Date;
  discount?: string;
  paidAmount?: string;
  creditAmount?: string;
  paymentMethod?: PaymentMethod;
  description?: string;
  items: SaleItemInput[];
  createdById: string;
}

export interface PurchaseItemInput {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export interface CreatePurchaseInput {
  supplierId: string;
  transactionDate?: Date;
  discount?: string;
  paidAmount?: string;
  creditAmount?: string;
  paymentMethod?: PaymentMethod;
  description?: string;
  items: PurchaseItemInput[];
  createdById: string;
}

export interface CreatePaymentInput {
  direction: PaymentDirection;
  customerId?: string;
  supplierId?: string;
  amount: string;
  paymentMethod?: PaymentMethod;
  transactionDate?: Date;
  notes?: string;
  createdById: string;
}

export interface CreateExpenseInput {
  expenseType: ExpenseType;
  category: ExpenseCategory;
  amount: string;
  paymentMethod?: PaymentMethod;
  transactionDate?: Date;
  notes?: string;
  createdById: string;
}

type Tx = Prisma.TransactionClient;
type DecimalLike = ReturnType<typeof d>;

/**
 * Single controlled service for all financial mutations.
 * Party balances are NEVER updated directly — only via LedgerEntry.
 * CashTransaction / Roznamcha is created ONLY for actual CASH movements.
 */
@Injectable()
export class FinancialTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Neon/pooler round-trips need more than Prisma's 5s default. */
  private runTx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn, { maxWait: 20_000, timeout: 60_000 });
  }

  async createSale(input: CreateSaleInput) {
    if (!input.items?.length) {
      throw new BadRequestException('Add at least one item');
    }

    return this.runTx(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: input.customerId, deletedAt: null, isActive: true },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const date = input.transactionDate ?? new Date();
      let subtotal = d(0);
      let profit = d(0);

      const lineData: Array<{
        productId: string;
        productName: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        costPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
        lineProfit: Prisma.Decimal;
      }> = [];

      for (const item of input.items) {
        const qty = assertPositiveMoney(item.quantity, 'Quantity');
        const unitPrice = assertPositiveMoney(item.unitPrice, 'Price');
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null, isActive: true },
        });
        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }

        // Snapshot cost at sale time — never use later Product.purchasePrice for historical profit
        const costPrice = d(product.purchasePrice.toString());
        const lineTotal = qty.mul(unitPrice);
        const lineProfit = qty.mul(unitPrice.minus(costPrice));
        subtotal = subtotal.plus(lineTotal);
        profit = profit.plus(lineProfit);

        lineData.push({
          productId: product.id,
          productName: product.name,
          quantity: new Prisma.Decimal(moneyStr(qty)),
          unitPrice: new Prisma.Decimal(moneyStr(unitPrice)),
          costPrice: new Prisma.Decimal(moneyStr(costPrice)),
          lineTotal: new Prisma.Decimal(moneyStr(lineTotal)),
          lineProfit: new Prisma.Decimal(moneyStr(lineProfit)),
        });
      }

      const discount = input.discount ? d(input.discount) : d(0);
      if (discount.lt(0)) throw new BadRequestException('Discount cannot be negative');
      if (discount.gt(subtotal)) {
        throw new BadRequestException('Discount cannot exceed total');
      }
      const total = subtotal.minus(discount);
      if (total.lte(0)) throw new BadRequestException('Sale total must be greater than zero');
      profit = profit.minus(discount);

      const { paidAmount, creditAmount, paymentMethod } = this.resolvePaidCredit(
        total,
        input.paidAmount,
        input.creditAmount,
        input.paymentMethod,
      );

      const saleCount = await tx.sale.count();
      const referenceNumber = buildReference('SALE', saleCount + 1);

      const sale = await tx.sale.create({
        data: {
          referenceNumber,
          customerId: customer.id,
          transactionDate: date,
          subtotal: new Prisma.Decimal(moneyStr(subtotal)),
          discount: new Prisma.Decimal(moneyStr(discount)),
          total: new Prisma.Decimal(moneyStr(total)),
          paidAmount: new Prisma.Decimal(moneyStr(paidAmount)),
          creditAmount: new Prisma.Decimal(moneyStr(creditAmount)),
          paymentMethod,
          profit: new Prisma.Decimal(moneyStr(profit)),
          description: input.description,
          createdById: input.createdById,
          items: { create: lineData },
        },
        include: { items: true, customer: true },
      });

      // Full sale amount increases customer outstanding
      await this.addLedgerEntry(tx, {
        partyType: LedgerPartyType.CUSTOMER,
        customerId: customer.id,
        entryType: LedgerEntryType.SALE,
        debit: total,
        credit: d(0),
        transactionDate: date,
        description: input.description ?? `Sale ${referenceNumber}`,
        saleId: sale.id,
        createdById: input.createdById,
      });

      // Immediate payment portion settles khata
      if (paidAmount.gt(0)) {
        await this.addLedgerEntry(tx, {
          partyType: LedgerPartyType.CUSTOMER,
          customerId: customer.id,
          entryType: LedgerEntryType.PAYMENT,
          debit: d(0),
          credit: paidAmount,
          transactionDate: date,
          description: `Payment on sale ${referenceNumber}`,
          saleId: sale.id,
          createdById: input.createdById,
        });

        // Cash sale / partial cash → Roznamcha. Pure credit → no cash row.
        if (paymentMethod === PaymentMethod.CASH) {
          await this.addCashTransaction(tx, {
            type: CashTransactionType.SALE_CASH,
            direction: CashDirection.IN,
            amount: paidAmount,
            paymentMethod,
            transactionDate: date,
            description: input.description ?? `Cash sale ${referenceNumber}`,
            saleId: sale.id,
            createdById: input.createdById,
          });
        }
      }

      const customerBalance = await this.getPartyBalance(
        LedgerPartyType.CUSTOMER,
        customer.id,
        tx,
      );
      const cashBalance = await this.getCashBalance(tx);

      return {
        sale,
        customerBalance: moneyStr(customerBalance),
        cashBalance: moneyStr(cashBalance),
      };
    });
  }

  async createPurchase(input: CreatePurchaseInput) {
    if (!input.items?.length) {
      throw new BadRequestException('Add at least one item');
    }

    return this.runTx(async (tx) => {
      const supplier = await tx.supplier.findFirst({
        where: { id: input.supplierId, deletedAt: null, isActive: true },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');

      const date = input.transactionDate ?? new Date();
      let subtotal = d(0);

      const lineData: Array<{
        productId: string;
        productName: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }> = [];

      for (const item of input.items) {
        const qty = assertPositiveMoney(item.quantity, 'Quantity');
        const unitPrice = assertPositiveMoney(item.unitPrice, 'Price');
        const product = await tx.product.findFirst({
          where: { id: item.productId, deletedAt: null, isActive: true },
        });
        if (!product) {
          throw new NotFoundException(`Product not found: ${item.productId}`);
        }

        const lineTotal = qty.mul(unitPrice);
        subtotal = subtotal.plus(lineTotal);

        lineData.push({
          productId: product.id,
          productName: product.name,
          quantity: new Prisma.Decimal(moneyStr(qty)),
          unitPrice: new Prisma.Decimal(moneyStr(unitPrice)),
          lineTotal: new Prisma.Decimal(moneyStr(lineTotal)),
        });

        // Update list purchase price for future sales cost snapshots (no stock tracking)
        await tx.product.update({
          where: { id: product.id },
          data: { purchasePrice: new Prisma.Decimal(moneyStr(unitPrice)) },
        });
      }

      const discount = input.discount ? d(input.discount) : d(0);
      if (discount.lt(0)) throw new BadRequestException('Discount cannot be negative');
      const total = subtotal.minus(discount);
      if (total.lte(0)) throw new BadRequestException('Purchase total must be greater than zero');

      const { paidAmount, creditAmount, paymentMethod } = this.resolvePaidCredit(
        total,
        input.paidAmount,
        input.creditAmount,
        input.paymentMethod,
      );

      const purchaseCount = await tx.purchase.count();
      const referenceNumber = buildReference('PURCHASE', purchaseCount + 1);

      const purchase = await tx.purchase.create({
        data: {
          referenceNumber,
          supplierId: supplier.id,
          transactionDate: date,
          subtotal: new Prisma.Decimal(moneyStr(subtotal)),
          discount: new Prisma.Decimal(moneyStr(discount)),
          total: new Prisma.Decimal(moneyStr(total)),
          paidAmount: new Prisma.Decimal(moneyStr(paidAmount)),
          creditAmount: new Prisma.Decimal(moneyStr(creditAmount)),
          paymentMethod,
          description: input.description,
          createdById: input.createdById,
          items: { create: lineData },
        },
        include: { items: true, supplier: true },
      });

      await this.addLedgerEntry(tx, {
        partyType: LedgerPartyType.SUPPLIER,
        supplierId: supplier.id,
        entryType: LedgerEntryType.PURCHASE,
        debit: total,
        credit: d(0),
        transactionDate: date,
        description: input.description ?? `Purchase ${referenceNumber}`,
        purchaseId: purchase.id,
        createdById: input.createdById,
      });

      if (paidAmount.gt(0)) {
        await this.addLedgerEntry(tx, {
          partyType: LedgerPartyType.SUPPLIER,
          supplierId: supplier.id,
          entryType: LedgerEntryType.PAYMENT,
          debit: d(0),
          credit: paidAmount,
          transactionDate: date,
          description: `Payment on purchase ${referenceNumber}`,
          purchaseId: purchase.id,
          createdById: input.createdById,
        });

        if (paymentMethod === PaymentMethod.CASH) {
          await this.addCashTransaction(tx, {
            type: CashTransactionType.PURCHASE_CASH,
            direction: CashDirection.OUT,
            amount: paidAmount,
            paymentMethod,
            transactionDate: date,
            description: input.description ?? `Cash purchase ${referenceNumber}`,
            purchaseId: purchase.id,
            createdById: input.createdById,
          });
        }
      }

      const supplierBalance = await this.getPartyBalance(
        LedgerPartyType.SUPPLIER,
        supplier.id,
        tx,
      );
      const cashBalance = await this.getCashBalance(tx);

      return {
        purchase,
        supplierBalance: moneyStr(supplierBalance),
        cashBalance: moneyStr(cashBalance),
      };
    });
  }

  async createPayment(input: CreatePaymentInput) {
    const amount = assertPositiveMoney(input.amount);

    return this.runTx(async (tx) => {
      const date = input.transactionDate ?? new Date();
      const paymentMethod = input.paymentMethod ?? PaymentMethod.CASH;
      const count = await tx.payment.count();
      const referenceNumber = buildReference('PAYMENT', count + 1);

      if (input.direction === PaymentDirection.RECEIVE) {
        if (!input.customerId) {
          throw new BadRequestException('Customer is required');
        }
        const customer = await tx.customer.findFirst({
          where: { id: input.customerId, deletedAt: null },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        const payment = await tx.payment.create({
          data: {
            referenceNumber,
            direction: PaymentDirection.RECEIVE,
            customerId: customer.id,
            amount: new Prisma.Decimal(moneyStr(amount)),
            paymentMethod,
            transactionDate: date,
            notes: input.notes,
            createdById: input.createdById,
          },
          include: { customer: true, supplier: true },
        });

        await this.addLedgerEntry(tx, {
          partyType: LedgerPartyType.CUSTOMER,
          customerId: customer.id,
          entryType: LedgerEntryType.PAYMENT,
          debit: d(0),
          credit: amount,
          transactionDate: date,
          description: input.notes ?? `Received from ${customer.name}`,
          paymentId: payment.id,
          createdById: input.createdById,
        });

        if (paymentMethod === PaymentMethod.CASH) {
          await this.addCashTransaction(tx, {
            type: CashTransactionType.CUSTOMER_PAYMENT,
            direction: CashDirection.IN,
            amount,
            paymentMethod,
            transactionDate: date,
            description: input.notes ?? `Received from ${customer.name}`,
            paymentId: payment.id,
            createdById: input.createdById,
          });
        }

        const customerBalance = await this.getPartyBalance(
          LedgerPartyType.CUSTOMER,
          customer.id,
          tx,
        );
        const cashBalance = await this.getCashBalance(tx);

        return {
          payment,
          customerBalance: moneyStr(customerBalance),
          supplierBalance: null as string | null,
          cashBalance: moneyStr(cashBalance),
        };
      }

      if (!input.supplierId) {
        throw new BadRequestException('Supplier is required');
      }
      const supplier = await tx.supplier.findFirst({
        where: { id: input.supplierId, deletedAt: null },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');

      const payment = await tx.payment.create({
        data: {
          referenceNumber,
          direction: PaymentDirection.PAY,
          supplierId: supplier.id,
          amount: new Prisma.Decimal(moneyStr(amount)),
          paymentMethod,
          transactionDate: date,
          notes: input.notes,
          createdById: input.createdById,
        },
        include: { customer: true, supplier: true },
      });

      await this.addLedgerEntry(tx, {
        partyType: LedgerPartyType.SUPPLIER,
        supplierId: supplier.id,
        entryType: LedgerEntryType.PAYMENT,
        debit: d(0),
        credit: amount,
        transactionDate: date,
        description: input.notes ?? `Paid to ${supplier.name}`,
        paymentId: payment.id,
        createdById: input.createdById,
      });

      if (paymentMethod === PaymentMethod.CASH) {
        await this.addCashTransaction(tx, {
          type: CashTransactionType.SUPPLIER_PAYMENT,
          direction: CashDirection.OUT,
          amount,
          paymentMethod,
          transactionDate: date,
          description: input.notes ?? `Paid to ${supplier.name}`,
          paymentId: payment.id,
          createdById: input.createdById,
        });
      }

      const supplierBalance = await this.getPartyBalance(
        LedgerPartyType.SUPPLIER,
        supplier.id,
        tx,
      );
      const cashBalance = await this.getCashBalance(tx);

      return {
        payment,
        customerBalance: null as string | null,
        supplierBalance: moneyStr(supplierBalance),
        cashBalance: moneyStr(cashBalance),
      };
    });
  }

  async createExpense(input: CreateExpenseInput) {
    const amount = assertPositiveMoney(input.amount);
    this.assertExpenseCategory(input.expenseType, input.category);

    return this.runTx(async (tx) => {
      const date = input.transactionDate ?? new Date();
      const paymentMethod = input.paymentMethod ?? PaymentMethod.CASH;
      const count = await tx.expense.count();
      const referenceNumber = buildReference('EXPENSE', count + 1);

      const expense = await tx.expense.create({
        data: {
          referenceNumber,
          expenseType: input.expenseType,
          category: input.category,
          amount: new Prisma.Decimal(moneyStr(amount)),
          paymentMethod,
          transactionDate: date,
          notes: input.notes,
          createdById: input.createdById,
        },
      });

      if (paymentMethod === PaymentMethod.CASH) {
        const cashType =
          input.expenseType === ExpenseType.BUSINESS
            ? CashTransactionType.EXPENSE_BUSINESS
            : CashTransactionType.EXPENSE_PERSONAL;

        await this.addCashTransaction(tx, {
          type: cashType,
          direction: CashDirection.OUT,
          amount,
          paymentMethod,
          transactionDate: date,
          description:
            input.notes ??
            `${input.expenseType === ExpenseType.BUSINESS ? 'Business' : 'Personal'} expense`,
          expenseId: expense.id,
          createdById: input.createdById,
        });
      }

      const cashBalance = await this.getCashBalance(tx);

      return {
        expense,
        cashBalance: moneyStr(cashBalance),
      };
    });
  }

  /** Customer profit = sum of Sale.profit for that customer (uses cost snapshots). */
  async getCustomerProfit(customerId: string) {
    const agg = await this.prisma.sale.aggregate({
      where: { customerId, deletedAt: null },
      _sum: { profit: true, total: true },
    });
    return {
      totalSales: moneyStr(agg._sum.total?.toString() ?? 0),
      totalProfit: moneyStr(agg._sum.profit?.toString() ?? 0),
    };
  }

  async getPartyBalance(
    partyType: LedgerPartyType,
    partyId: string,
    tx?: Tx,
  ) {
    const client = tx ?? this.prisma;
    const where =
      partyType === LedgerPartyType.CUSTOMER
        ? { customerId: partyId }
        : { supplierId: partyId };

    const agg = await client.ledgerEntry.aggregate({
      where,
      _sum: { debit: true, credit: true },
    });

    const debit = d(agg._sum.debit?.toString() ?? 0);
    const credit = d(agg._sum.credit?.toString() ?? 0);
    return debit.minus(credit);
  }

  async getCashBalance(tx?: Tx) {
    const client = tx ?? this.prisma;
    const account = await client.cashAccount.findUnique({
      where: { id: 'main' },
    });
    return d(account?.balance.toString() ?? 0);
  }

  /**
   * Resolve paid/credit so paid + credit = total.
   * Defaults: if neither provided → full credit; if only paid → remainder is credit.
   */
  private resolvePaidCredit(
    total: DecimalLike,
    paidRaw?: string,
    creditRaw?: string,
    method?: PaymentMethod,
  ) {
    const paymentMethod = method ?? PaymentMethod.CASH;
    let paidAmount = paidRaw !== undefined ? d(paidRaw) : null;
    let creditAmount = creditRaw !== undefined ? d(creditRaw) : null;

    if (paidAmount && paidAmount.lt(0)) {
      throw new BadRequestException('Paid amount cannot be negative');
    }
    if (creditAmount && creditAmount.lt(0)) {
      throw new BadRequestException('Credit amount cannot be negative');
    }

    if (paidAmount === null && creditAmount === null) {
      // Full credit by default when neither specified
      paidAmount = d(0);
      creditAmount = total;
    } else if (paidAmount === null && creditAmount !== null) {
      paidAmount = total.minus(creditAmount);
    } else if (paidAmount !== null && creditAmount === null) {
      creditAmount = total.minus(paidAmount);
    }

    if (paidAmount!.lt(0) || creditAmount!.lt(0)) {
      throw new BadRequestException(
        'Paid/credit amounts are invalid for this total',
      );
    }

    if (paidAmount!.gt(total)) {
      throw new BadRequestException('Paid amount cannot exceed total amount');
    }
    if (creditAmount!.gt(total)) {
      throw new BadRequestException('Credit amount cannot exceed total amount');
    }

    if (!paidAmount!.plus(creditAmount!).eq(total)) {
      throw new BadRequestException(
        `Paid (${moneyStr(paidAmount!)}) + credit (${moneyStr(creditAmount!)}) must equal total (${moneyStr(total)})`,
      );
    }

    return {
      paidAmount: paidAmount!,
      creditAmount: creditAmount!,
      paymentMethod,
    };
  }

  private assertExpenseCategory(type: ExpenseType, category: ExpenseCategory) {
    const business: ExpenseCategory[] = [
      ExpenseCategory.LABOUR,
      ExpenseCategory.FUEL,
      ExpenseCategory.TRANSPORT,
      ExpenseCategory.ELECTRICITY,
      ExpenseCategory.RENT,
      ExpenseCategory.OTHER,
    ];
    const personal: ExpenseCategory[] = [
      ExpenseCategory.HOME,
      ExpenseCategory.FAMILY,
      ExpenseCategory.PERSONAL,
      ExpenseCategory.OTHER,
    ];
    const allowed = type === ExpenseType.BUSINESS ? business : personal;
    if (!allowed.includes(category)) {
      throw new BadRequestException(
        `Category ${category} is not valid for ${type} expenses`,
      );
    }
  }

  private async addLedgerEntry(
    tx: Tx,
    params: {
      partyType: LedgerPartyType;
      customerId?: string;
      supplierId?: string;
      entryType: LedgerEntryType;
      debit: DecimalLike;
      credit: DecimalLike;
      transactionDate: Date;
      description: string;
      saleId?: string;
      purchaseId?: string;
      paymentId?: string;
      createdById: string;
    },
  ) {
    const partyId =
      params.partyType === LedgerPartyType.CUSTOMER
        ? params.customerId!
        : params.supplierId!;

    const current = await this.getPartyBalance(params.partyType, partyId, tx);
    const balanceAfter = current.plus(params.debit).minus(params.credit);

    const count = await tx.ledgerEntry.count();
    const referenceNumber = buildReference('LEDGER', count + 1);

    return tx.ledgerEntry.create({
      data: {
        referenceNumber,
        partyType: params.partyType,
        customerId: params.customerId,
        supplierId: params.supplierId,
        entryType: params.entryType,
        debit: new Prisma.Decimal(moneyStr(params.debit)),
        credit: new Prisma.Decimal(moneyStr(params.credit)),
        balanceAfter: new Prisma.Decimal(moneyStr(balanceAfter)),
        transactionDate: params.transactionDate,
        description: params.description,
        saleId: params.saleId,
        purchaseId: params.purchaseId,
        paymentId: params.paymentId,
        createdById: params.createdById,
      },
    });
  }

  private async addCashTransaction(
    tx: Tx,
    params: {
      type: CashTransactionType;
      direction: CashDirection;
      amount: DecimalLike;
      paymentMethod: PaymentMethod;
      transactionDate: Date;
      description: string;
      saleId?: string;
      purchaseId?: string;
      paymentId?: string;
      expenseId?: string;
      createdById: string;
    },
  ) {
    if (params.amount.lte(0)) {
      throw new BadRequestException('Cash amount must be greater than zero');
    }

    await tx.cashAccount.upsert({
      where: { id: 'main' },
      create: { id: 'main', balance: 0 },
      update: {},
    });

    const current = await this.getCashBalance(tx);
    const delta =
      params.direction === CashDirection.IN ? params.amount : params.amount.neg();
    const balanceAfter = current.plus(delta);

    await tx.cashAccount.update({
      where: { id: 'main' },
      data: { balance: new Prisma.Decimal(moneyStr(balanceAfter)) },
    });

    const count = await tx.cashTransaction.count();
    const referenceNumber = buildReference('CASH', count + 1);

    return tx.cashTransaction.create({
      data: {
        referenceNumber,
        type: params.type,
        direction: params.direction,
        amount: new Prisma.Decimal(moneyStr(params.amount)),
        balanceAfter: new Prisma.Decimal(moneyStr(balanceAfter)),
        paymentMethod: params.paymentMethod,
        transactionDate: params.transactionDate,
        description: params.description,
        saleId: params.saleId,
        purchaseId: params.purchaseId,
        paymentId: params.paymentId,
        expenseId: params.expenseId,
        createdById: params.createdById,
      },
    });
  }
}
