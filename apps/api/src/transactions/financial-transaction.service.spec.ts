import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CashDirection,
  CashTransactionType,
  ExpenseCategory,
  ExpenseType,
  LedgerEntryType,
  LedgerPartyType,
  PaymentDirection,
  PaymentMethod,
} from '../generated/prisma';
import { FinancialTransactionService } from './financial-transaction.service';
import { d } from '../common/money';

type Row = Record<string, unknown>;

/**
 * In-memory Prisma stub that supports $transaction and the subset of
 * models used by FinancialTransactionService.
 */
function createPrismaMock() {
  const state = {
    customers: new Map<string, Row>(),
    suppliers: new Map<string, Row>(),
    products: new Map<string, Row>(),
    sales: [] as Row[],
    saleItems: [] as Row[],
    purchases: [] as Row[],
    purchaseItems: [] as Row[],
    payments: [] as Row[],
    expenses: [] as Row[],
    ledger: [] as Row[],
    cash: [] as Row[],
    cashAccount: { id: 'main', balance: '0' } as Row,
    seq: 0,
  };

  const id = () => {
    state.seq += 1;
    return `00000000-0000-4000-8000-${String(state.seq).padStart(12, '0')}`;
  };

  const dec = (v: unknown) => ({
    toString: () => String(v),
  });

  const partyBalance = (partyType: string, partyId: string) => {
    let debit = d(0);
    let credit = d(0);
    for (const e of state.ledger) {
      const match =
        partyType === 'CUSTOMER'
          ? e.customerId === partyId
          : e.supplierId === partyId;
      if (!match) continue;
      debit = debit.plus(d(String((e.debit as { toString(): string }).toString())));
      credit = credit.plus(d(String((e.credit as { toString(): string }).toString())));
    }
    return debit.minus(credit);
  };

  const txClient = {
    customer: {
      findFirst: async ({ where }: { where: Row }) => {
        const c = state.customers.get(String(where.id));
        if (!c) return null;
        if (where.deletedAt === null && c.deletedAt) return null;
        if (where.isActive === true && !c.isActive) return null;
        return c;
      },
    },
    supplier: {
      findFirst: async ({ where }: { where: Row }) => {
        const s = state.suppliers.get(String(where.id));
        if (!s) return null;
        if (where.deletedAt === null && s.deletedAt) return null;
        if (where.isActive === true && !s.isActive) return null;
        return s;
      },
    },
    product: {
      findFirst: async ({ where }: { where: Row }) => {
        const p = state.products.get(String(where.id));
        if (!p) return null;
        if (where.deletedAt === null && p.deletedAt) return null;
        if (where.isActive === true && !p.isActive) return null;
        return p;
      },
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const p = state.products.get(String(where.id))!;
        Object.assign(p, data);
        return p;
      },
    },
    sale: {
      count: async () => state.sales.length,
      create: async ({ data, include }: { data: Row; include?: Row }) => {
        const saleId = id();
        const itemsData = (data.items as { create: Row[] }).create;
        const items = itemsData.map((item) => ({
          id: id(),
          saleId,
          ...item,
        }));
        state.saleItems.push(...items);
        const { items: _items, ...rest } = data as Row & { items: unknown };
        const stored = {
          id: saleId,
          ...rest,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          customer: include?.customer
            ? state.customers.get(String(data.customerId))
            : undefined,
          items,
        };
        state.sales.push(stored);
        return stored;
      },
    },
    purchase: {
      count: async () => state.purchases.length,
      create: async ({ data, include }: { data: Row; include?: Row }) => {
        const purchaseId = id();
        const itemsData = (data.items as { create: Row[] }).create;
        const items = itemsData.map((item) => ({
          id: id(),
          purchaseId,
          ...item,
        }));
        state.purchaseItems.push(...items);
        const { items: _items, ...rest } = data as Row & { items: unknown };
        const stored = {
          id: purchaseId,
          ...rest,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          supplier: include?.supplier
            ? state.suppliers.get(String(data.supplierId))
            : undefined,
          items,
        };
        state.purchases.push(stored);
        return stored;
      },
    },
    payment: {
      count: async () => state.payments.length,
      create: async ({ data, include }: { data: Row; include?: Row }) => {
        const payment = {
          id: id(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          customer: data.customerId
            ? state.customers.get(String(data.customerId))
            : null,
          supplier: data.supplierId
            ? state.suppliers.get(String(data.supplierId))
            : null,
        };
        state.payments.push(payment);
        return payment;
      },
    },
    expense: {
      count: async () => state.expenses.length,
      create: async ({ data }: { data: Row }) => {
        const expense = {
          id: id(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        state.expenses.push(expense);
        return expense;
      },
    },
    ledgerEntry: {
      count: async () => state.ledger.length,
      aggregate: async ({ where }: { where: Row }) => {
        let debit = d(0);
        let credit = d(0);
        for (const e of state.ledger) {
          if (where.customerId && e.customerId !== where.customerId) continue;
          if (where.supplierId && e.supplierId !== where.supplierId) continue;
          debit = debit.plus(d(String((e.debit as { toString(): string }).toString())));
          credit = credit.plus(
            d(String((e.credit as { toString(): string }).toString())),
          );
        }
        return { _sum: { debit: dec(debit.toString()), credit: dec(credit.toString()) } };
      },
      create: async ({ data }: { data: Row }) => {
        const entry = { id: id(), createdAt: new Date(), ...data };
        state.ledger.push(entry);
        return entry;
      },
    },
    cashAccount: {
      findUnique: async () => ({
        ...state.cashAccount,
        balance: dec(state.cashAccount.balance),
      }),
      upsert: async () => state.cashAccount,
      update: async ({ data }: { data: Row }) => {
        state.cashAccount.balance = String(
          (data.balance as { toString(): string }).toString(),
        );
        return state.cashAccount;
      },
    },
    cashTransaction: {
      count: async () => state.cash.length,
      create: async ({ data }: { data: Row }) => {
        const row = { id: id(), createdAt: new Date(), ...data };
        state.cash.push(row);
        return row;
      },
    },
  };

  const prisma = {
    $transaction: async (fn: (tx: typeof txClient) => Promise<unknown>) =>
      fn(txClient),
    ...txClient,
    _state: state,
    _seedCustomer(idValue: string, name = 'Customer') {
      state.customers.set(idValue, {
        id: idValue,
        name,
        isActive: true,
        deletedAt: null,
      });
    },
    _seedSupplier(idValue: string, name = 'Supplier') {
      state.suppliers.set(idValue, {
        id: idValue,
        name,
        isActive: true,
        deletedAt: null,
      });
    },
    _seedProduct(
      idValue: string,
      opts: { name?: string; purchasePrice?: string; salePrice?: string } = {},
    ) {
      state.products.set(idValue, {
        id: idValue,
        name: opts.name ?? 'Sheesham',
        purchasePrice: dec(opts.purchasePrice ?? '220'),
        salePrice: dec(opts.salePrice ?? '280'),
        unit: 'cft',
        isActive: true,
        deletedAt: null,
      });
    },
    _partyBalance: partyBalance,
  };

  return prisma;
}

describe('FinancialTransactionService', () => {
  const USER = '00000000-0000-4000-8000-000000000099';
  const CUSTOMER = '00000000-0000-4000-8000-000000000001';
  const SUPPLIER = '00000000-0000-4000-8000-000000000002';
  const PRODUCT = '00000000-0000-4000-8000-000000000021';

  let prisma: ReturnType<typeof createPrismaMock>;
  let service: FinancialTransactionService;

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma._seedCustomer(CUSTOMER, 'Ahmed Khan');
    prisma._seedSupplier(SUPPLIER, 'City Timber');
    prisma._seedProduct(PRODUCT, {
      name: 'Sheesham',
      purchasePrice: '220',
      salePrice: '280',
    });
    service = new FinancialTransactionService(prisma as never);
  });

  describe('Cash Sale', () => {
    it('creates sale, items, cost snapshot, profit, ledger settle, and cash IN', async () => {
      const result = await service.createSale({
        customerId: CUSTOMER,
        paidAmount: '560',
        creditAmount: '0',
        paymentMethod: PaymentMethod.CASH,
        items: [{ productId: PRODUCT, quantity: '2', unitPrice: '280' }],
        createdById: USER,
      });

      expect(result.sale.total.toString()).toBe('560');
      expect(result.sale.profit.toString()).toBe('120'); // (280-220)*2
      expect(result.sale.items[0].costPrice.toString()).toBe('220');
      expect(result.customerBalance).toBe('0.0000');
      expect(result.cashBalance).toBe('560.0000');

      expect(prisma._state.ledger).toHaveLength(2);
      expect(prisma._state.ledger[0].entryType).toBe(LedgerEntryType.SALE);
      expect(prisma._state.ledger[1].entryType).toBe(LedgerEntryType.PAYMENT);

      expect(prisma._state.cash).toHaveLength(1);
      expect(prisma._state.cash[0].type).toBe(CashTransactionType.SALE_CASH);
      expect(prisma._state.cash[0].direction).toBe(CashDirection.IN);
    });
  });

  describe('Credit Sale', () => {
    it('creates sale + ledger debit but NO cash transaction', async () => {
      const result = await service.createSale({
        customerId: CUSTOMER,
        paidAmount: '0',
        creditAmount: '2800',
        paymentMethod: PaymentMethod.CASH,
        items: [{ productId: PRODUCT, quantity: '10', unitPrice: '280' }],
        createdById: USER,
      });

      expect(result.sale.creditAmount.toString()).toBe('2800');
      expect(result.sale.profit.toString()).toBe('600');
      expect(result.customerBalance).toBe('2800.0000');
      expect(result.cashBalance).toBe('0.0000');
      expect(prisma._state.cash).toHaveLength(0);
      expect(prisma._state.ledger).toHaveLength(1);
      expect(prisma._state.ledger[0].entryType).toBe(LedgerEntryType.SALE);
    });
  });

  describe('Cash Purchase', () => {
    it('creates purchase, supplier ledger settle, and cash OUT', async () => {
      // Seed cash so we can pay out
      prisma._state.cashAccount.balance = '10000';

      const result = await service.createPurchase({
        supplierId: SUPPLIER,
        paidAmount: '2200',
        creditAmount: '0',
        paymentMethod: PaymentMethod.CASH,
        items: [{ productId: PRODUCT, quantity: '10', unitPrice: '220' }],
        createdById: USER,
      });

      expect(result.purchase.total.toString()).toBe('2200');
      expect(result.supplierBalance).toBe('0.0000');
      expect(result.cashBalance).toBe('7800.0000');
      expect(prisma._state.cash).toHaveLength(1);
      expect(prisma._state.cash[0].type).toBe(CashTransactionType.PURCHASE_CASH);
      expect(prisma._state.cash[0].direction).toBe(CashDirection.OUT);
      expect(prisma._state.ledger).toHaveLength(2);
    });
  });

  describe('Credit Purchase', () => {
    it('creates purchase + supplier ledger but NO cash transaction', async () => {
      const result = await service.createPurchase({
        supplierId: SUPPLIER,
        paidAmount: '0',
        creditAmount: '2200',
        paymentMethod: PaymentMethod.CASH,
        items: [{ productId: PRODUCT, quantity: '10', unitPrice: '220' }],
        createdById: USER,
      });

      expect(result.supplierBalance).toBe('2200.0000');
      expect(result.cashBalance).toBe('0.0000');
      expect(prisma._state.cash).toHaveLength(0);
      expect(prisma._state.ledger).toHaveLength(1);
      expect(prisma._state.ledger[0].partyType).toBe(LedgerPartyType.SUPPLIER);
    });
  });

  describe('Customer Payment', () => {
    it('credits customer ledger and creates cash IN', async () => {
      // Outstanding first via credit sale
      await service.createSale({
        customerId: CUSTOMER,
        paidAmount: '0',
        creditAmount: '1000',
        items: [{ productId: PRODUCT, quantity: '1', unitPrice: '1000' }],
        createdById: USER,
      });

      const result = await service.createPayment({
        direction: PaymentDirection.RECEIVE,
        customerId: CUSTOMER,
        amount: '400',
        paymentMethod: PaymentMethod.CASH,
        createdById: USER,
      });

      expect(result.customerBalance).toBe('600.0000');
      expect(result.cashBalance).toBe('400.0000');
      expect(prisma._state.cash.at(-1)?.type).toBe(
        CashTransactionType.CUSTOMER_PAYMENT,
      );
      expect(prisma._state.cash.at(-1)?.direction).toBe(CashDirection.IN);
    });
  });

  describe('Supplier Payment', () => {
    it('credits supplier ledger and creates cash OUT', async () => {
      prisma._state.cashAccount.balance = '5000';
      await service.createPurchase({
        supplierId: SUPPLIER,
        paidAmount: '0',
        creditAmount: '2000',
        items: [{ productId: PRODUCT, quantity: '10', unitPrice: '200' }],
        createdById: USER,
      });

      const result = await service.createPayment({
        direction: PaymentDirection.PAY,
        supplierId: SUPPLIER,
        amount: '500',
        paymentMethod: PaymentMethod.CASH,
        createdById: USER,
      });

      expect(result.supplierBalance).toBe('1500.0000');
      expect(result.cashBalance).toBe('4500.0000');
      expect(prisma._state.cash.at(-1)?.type).toBe(
        CashTransactionType.SUPPLIER_PAYMENT,
      );
      expect(prisma._state.cash.at(-1)?.direction).toBe(CashDirection.OUT);
    });
  });

  describe('Business Expense', () => {
    it('creates business expense and cash OUT', async () => {
      prisma._state.cashAccount.balance = '1000';

      const result = await service.createExpense({
        expenseType: ExpenseType.BUSINESS,
        category: ExpenseCategory.FUEL,
        amount: '150',
        paymentMethod: PaymentMethod.CASH,
        createdById: USER,
      });

      expect(result.expense.expenseType).toBe(ExpenseType.BUSINESS);
      expect(result.expense.category).toBe(ExpenseCategory.FUEL);
      expect(result.cashBalance).toBe('850.0000');
      expect(prisma._state.cash[0].type).toBe(
        CashTransactionType.EXPENSE_BUSINESS,
      );
    });
  });

  describe('Personal Expense', () => {
    it('creates personal expense separately with cash OUT', async () => {
      prisma._state.cashAccount.balance = '1000';

      const result = await service.createExpense({
        expenseType: ExpenseType.PERSONAL,
        category: ExpenseCategory.FAMILY,
        amount: '200',
        paymentMethod: PaymentMethod.CASH,
        createdById: USER,
      });

      expect(result.expense.expenseType).toBe(ExpenseType.PERSONAL);
      expect(result.expense.category).toBe(ExpenseCategory.FAMILY);
      expect(result.cashBalance).toBe('800.0000');
      expect(prisma._state.cash[0].type).toBe(
        CashTransactionType.EXPENSE_PERSONAL,
      );
    });

    it('rejects business category on personal expense', async () => {
      await expect(
        service.createExpense({
          expenseType: ExpenseType.PERSONAL,
          category: ExpenseCategory.FUEL,
          amount: '50',
          createdById: USER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('Validation', () => {
    it('rejects amount <= 0', async () => {
      await expect(
        service.createPayment({
          direction: PaymentDirection.RECEIVE,
          customerId: CUSTOMER,
          amount: '0',
          createdById: USER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid customer', async () => {
      await expect(
        service.createSale({
          customerId: '00000000-0000-4000-8000-999999999999',
          paidAmount: '100',
          creditAmount: '0',
          items: [{ productId: PRODUCT, quantity: '1', unitPrice: '100' }],
          createdById: USER,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects paid amount exceeding total', async () => {
      await expect(
        service.createSale({
          customerId: CUSTOMER,
          paidAmount: '9999',
          creditAmount: '0',
          items: [{ productId: PRODUCT, quantity: '1', unitPrice: '100' }],
          createdById: USER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects credit amount exceeding total', async () => {
      await expect(
        service.createSale({
          customerId: CUSTOMER,
          paidAmount: '0',
          creditAmount: '9999',
          items: [{ productId: PRODUCT, quantity: '1', unitPrice: '100' }],
          createdById: USER,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
