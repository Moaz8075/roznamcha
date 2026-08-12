import { z } from 'zod';
import {
  BUSINESS_EXPENSE_CATEGORIES,
  EXPENSE_TYPES,
  PAYMENT_DIRECTIONS,
  PAYMENT_METHODS,
  PERSONAL_EXPENSE_CATEGORIES,
} from '@roznamcha/constants';

/** Non-negative decimal string suitable for money. */
export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,4})?$/, 'Enter a valid amount')
  .refine((v) => Number(v) > 0, 'Amount must be greater than zero');

export const nonNegativeMoneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,4})?$/, 'Enter a valid amount')
  .refine((v) => Number(v) >= 0, 'Amount cannot be negative');

export const optionalMoneySchema = nonNegativeMoneySchema.optional();

export const paymentMethodSchema = z.enum([
  PAYMENT_METHODS.CASH,
  PAYMENT_METHODS.BANK,
  PAYMENT_METHODS.MOBILE,
  PAYMENT_METHODS.OTHER,
]);

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  unit: z.string().trim().max(30).default('cft'),
  salePrice: optionalMoneySchema,
  purchasePrice: optionalMoneySchema,
});

export const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: moneySchema,
  unitPrice: moneySchema,
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid(),
  transactionDate: z.string().datetime().optional(),
  discount: optionalMoneySchema,
  paidAmount: optionalMoneySchema,
  creditAmount: optionalMoneySchema,
  paymentMethod: paymentMethodSchema.default(PAYMENT_METHODS.CASH),
  description: z.string().trim().max(500).optional(),
  items: z.array(saleItemSchema).min(1, 'Add at least one item'),
});

export const purchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: moneySchema,
  unitPrice: moneySchema,
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().uuid(),
  transactionDate: z.string().datetime().optional(),
  discount: optionalMoneySchema,
  paidAmount: optionalMoneySchema,
  creditAmount: optionalMoneySchema,
  paymentMethod: paymentMethodSchema.default(PAYMENT_METHODS.CASH),
  description: z.string().trim().max(500).optional(),
  items: z.array(purchaseItemSchema).min(1, 'Add at least one item'),
});

export const createPaymentSchema = z
  .object({
    direction: z.enum([PAYMENT_DIRECTIONS.RECEIVE, PAYMENT_DIRECTIONS.PAY]),
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    amount: moneySchema,
    paymentMethod: paymentMethodSchema.default(PAYMENT_METHODS.CASH),
    transactionDate: z.string().datetime().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.direction === PAYMENT_DIRECTIONS.RECEIVE && !data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer is required to receive money',
        path: ['customerId'],
      });
    }
    if (data.direction === PAYMENT_DIRECTIONS.PAY && !data.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Supplier is required to pay',
        path: ['supplierId'],
      });
    }
  });

const businessCategories = Object.values(BUSINESS_EXPENSE_CATEGORIES) as [
  string,
  ...string[],
];
const personalCategories = Object.values(PERSONAL_EXPENSE_CATEGORIES) as [
  string,
  ...string[],
];

export const createExpenseSchema = z
  .object({
    expenseType: z.enum([EXPENSE_TYPES.BUSINESS, EXPENSE_TYPES.PERSONAL]),
    category: z.enum([
      ...businessCategories,
      ...personalCategories,
    ] as [string, ...string[]]),
    amount: moneySchema,
    paymentMethod: paymentMethodSchema.default(PAYMENT_METHODS.CASH),
    transactionDate: z.string().datetime().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    const allowed =
      data.expenseType === EXPENSE_TYPES.BUSINESS
        ? businessCategories
        : personalCategories;
    if (!allowed.includes(data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Category ${data.category} is not valid for ${data.expenseType} expenses`,
        path: ['category'],
      });
    }
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
