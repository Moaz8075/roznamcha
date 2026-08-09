import type {
  CashDirection,
  CashTransactionType,
  ExpenseCategory,
  ExpenseType,
  LedgerEntryType,
  LedgerPartyType,
  PaymentDirection,
  PaymentMethod,
  UserRole,
} from '@roznamcha/constants';

/** Money values are always stringified decimals over the wire (never JS number). */
export type MoneyString = string;

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDto {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  /** Derived outstanding (debit − credit). Positive = customer owes you. */
  balance: MoneyString;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDto {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  /** Derived outstanding. Positive = you owe supplier. */
  balance: MoneyString;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDto {
  id: string;
  name: string;
  unit: string;
  salePrice: MoneyString;
  purchasePrice: MoneyString;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: MoneyString;
  unitPrice: MoneyString;
  /** Cost snapshot at sale time */
  costPrice: MoneyString;
  lineTotal: MoneyString;
  lineProfit: MoneyString;
}

export interface SaleDto {
  id: string;
  referenceNumber: string;
  customerId: string;
  customerName: string;
  transactionDate: string;
  subtotal: MoneyString;
  discount: MoneyString;
  total: MoneyString;
  paidAmount: MoneyString;
  creditAmount: MoneyString;
  paymentMethod: PaymentMethod;
  profit: MoneyString;
  description: string | null;
  items: SaleItemDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PurchaseItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: MoneyString;
  unitPrice: MoneyString;
  lineTotal: MoneyString;
}

export interface PurchaseDto {
  id: string;
  referenceNumber: string;
  supplierId: string;
  supplierName: string;
  transactionDate: string;
  subtotal: MoneyString;
  discount: MoneyString;
  total: MoneyString;
  paidAmount: MoneyString;
  creditAmount: MoneyString;
  paymentMethod: PaymentMethod;
  description: string | null;
  items: PurchaseItemDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PaymentDto {
  id: string;
  referenceNumber: string;
  direction: PaymentDirection;
  customerId: string | null;
  supplierId: string | null;
  partyName: string;
  amount: MoneyString;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExpenseDto {
  id: string;
  referenceNumber: string;
  expenseType: ExpenseType;
  category: ExpenseCategory;
  amount: MoneyString;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LedgerEntryDto {
  id: string;
  referenceNumber: string;
  partyType: LedgerPartyType;
  customerId: string | null;
  supplierId: string | null;
  entryType: LedgerEntryType;
  debit: MoneyString;
  credit: MoneyString;
  balanceAfter: MoneyString;
  transactionDate: string;
  description: string | null;
  /** Line-item summaries from linked sale/purchase (e.g. "Pine × 12") */
  detailLines: string[];
  itemCount: number;
  saleId: string | null;
  purchaseId: string | null;
  paymentId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CashTransactionDto {
  id: string;
  referenceNumber: string;
  type: CashTransactionType;
  direction: CashDirection;
  amount: MoneyString;
  balanceAfter: MoneyString;
  paymentMethod: PaymentMethod;
  transactionDate: string;
  description: string | null;
  saleId: string | null;
  purchaseId: string | null;
  paymentId: string | null;
  expenseId: string | null;
  createdBy: string;
  createdAt: string;
}

/** Daily Roznamcha summary derived from CashTransaction */
export interface RoznamchaSummaryDto {
  date: string;
  openingCash: MoneyString;
  cashReceived: MoneyString;
  cashPaid: MoneyString;
  closingCash: MoneyString;
  items: CashTransactionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummaryDto {
  cashBalance: MoneyString;
  todayCashIn: MoneyString;
  todayCashOut: MoneyString;
  customerOutstanding: MoneyString;
  supplierOutstanding: MoneyString;
  todaySales: MoneyString;
  todayExpenses: MoneyString;
  todayProfit: MoneyString;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface CreateProductRequest {
  name: string;
  unit?: string;
  salePrice: MoneyString;
  purchasePrice: MoneyString;
}

export interface SaleItemInput {
  productId: string;
  quantity: MoneyString;
  unitPrice: MoneyString;
}

export interface CreateSaleRequest {
  customerId: string;
  transactionDate?: string;
  discount?: MoneyString;
  /** Amount collected now. Defaults to 0 (full credit) if omitted with creditAmount. */
  paidAmount?: MoneyString;
  /** Amount on khata. If omitted, computed as total − paidAmount. */
  creditAmount?: MoneyString;
  paymentMethod?: PaymentMethod;
  description?: string;
  items: SaleItemInput[];
}

export interface PurchaseItemInput {
  productId: string;
  quantity: MoneyString;
  unitPrice: MoneyString;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  transactionDate?: string;
  discount?: MoneyString;
  paidAmount?: MoneyString;
  creditAmount?: MoneyString;
  paymentMethod?: PaymentMethod;
  description?: string;
  items: PurchaseItemInput[];
}

export interface CreatePaymentRequest {
  direction: PaymentDirection;
  customerId?: string;
  supplierId?: string;
  amount: MoneyString;
  paymentMethod?: PaymentMethod;
  transactionDate?: string;
  notes?: string;
}

export interface CreateExpenseRequest {
  expenseType: ExpenseType;
  category: ExpenseCategory;
  amount: MoneyString;
  paymentMethod?: PaymentMethod;
  transactionDate?: string;
  notes?: string;
}
