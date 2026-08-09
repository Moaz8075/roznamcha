export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK: 'BANK',
  MOBILE: 'MOBILE',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK: 'Bank',
  MOBILE: 'Mobile Wallet',
  OTHER: 'Other',
};

export const PAYMENT_DIRECTIONS = {
  RECEIVE: 'RECEIVE',
  PAY: 'PAY',
} as const;

export type PaymentDirection = (typeof PAYMENT_DIRECTIONS)[keyof typeof PAYMENT_DIRECTIONS];

export const EXPENSE_TYPES = {
  BUSINESS: 'BUSINESS',
  PERSONAL: 'PERSONAL',
} as const;

export type ExpenseType = (typeof EXPENSE_TYPES)[keyof typeof EXPENSE_TYPES];

export const BUSINESS_EXPENSE_CATEGORIES = {
  LABOUR: 'LABOUR',
  FUEL: 'FUEL',
  TRANSPORT: 'TRANSPORT',
  ELECTRICITY: 'ELECTRICITY',
  RENT: 'RENT',
  OTHER: 'OTHER',
} as const;

export const PERSONAL_EXPENSE_CATEGORIES = {
  HOME: 'HOME',
  FAMILY: 'FAMILY',
  PERSONAL: 'PERSONAL',
  OTHER: 'OTHER',
} as const;

export const EXPENSE_CATEGORIES = {
  ...BUSINESS_EXPENSE_CATEGORIES,
  ...PERSONAL_EXPENSE_CATEGORIES,
} as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];
export type BusinessExpenseCategory =
  (typeof BUSINESS_EXPENSE_CATEGORIES)[keyof typeof BUSINESS_EXPENSE_CATEGORIES];
export type PersonalExpenseCategory =
  (typeof PERSONAL_EXPENSE_CATEGORIES)[keyof typeof PERSONAL_EXPENSE_CATEGORIES];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  LABOUR: 'Labour',
  FUEL: 'Fuel',
  TRANSPORT: 'Transport',
  ELECTRICITY: 'Electricity',
  RENT: 'Rent',
  HOME: 'Home',
  FAMILY: 'Family',
  PERSONAL: 'Personal',
  OTHER: 'Other',
};

export const LEDGER_PARTY_TYPES = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
} as const;

export type LedgerPartyType = (typeof LEDGER_PARTY_TYPES)[keyof typeof LEDGER_PARTY_TYPES];

export const LEDGER_ENTRY_TYPES = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  PAYMENT: 'PAYMENT',
  ADJUSTMENT: 'ADJUSTMENT',
  REVERSAL: 'REVERSAL',
} as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPES)[keyof typeof LEDGER_ENTRY_TYPES];

export const CASH_TRANSACTION_TYPES = {
  SALE_CASH: 'SALE_CASH',
  PURCHASE_CASH: 'PURCHASE_CASH',
  CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
  SUPPLIER_PAYMENT: 'SUPPLIER_PAYMENT',
  EXPENSE_BUSINESS: 'EXPENSE_BUSINESS',
  EXPENSE_PERSONAL: 'EXPENSE_PERSONAL',
  ADJUSTMENT: 'ADJUSTMENT',
  REVERSAL: 'REVERSAL',
} as const;

export type CashTransactionType =
  (typeof CASH_TRANSACTION_TYPES)[keyof typeof CASH_TRANSACTION_TYPES];

/** Cash movement direction for Roznamcha (actual cash only). */
export const CASH_DIRECTIONS = {
  IN: 'IN',
  OUT: 'OUT',
} as const;

export type CashDirection = (typeof CASH_DIRECTIONS)[keyof typeof CASH_DIRECTIONS];

export const REFERENCE_PREFIXES = {
  SALE: 'SAL',
  PURCHASE: 'PUR',
  PAYMENT: 'PAY',
  EXPENSE: 'EXP',
  LEDGER: 'LED',
  CASH: 'CSH',
} as const;

/** Wood trading default product unit */
export const DEFAULT_PRODUCT_UNIT = 'cft';
