import type {
  ApiResponse,
  AuthUser,
  CreateCustomerRequest,
  CreateExpenseRequest,
  CreatePaymentRequest,
  CreateProductRequest,
  CreatePurchaseRequest,
  CreateSaleRequest,
  CreateSupplierRequest,
  CustomerDto,
  DashboardSummaryDto,
  ExpenseDto,
  LoginRequest,
  LoginResponse,
  PaginatedData,
  PaymentDto,
  ProductDto,
  PurchaseDto,
  SaleDto,
  SupplierDto,
  LedgerEntryDto,
  RoznamchaSummaryDto,
} from '@roznamcha/types';

export type TokenProvider = () => string | null | Promise<string | null>;
export type OnUnauthorized = () => void;

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: TokenProvider;
  onUnauthorized?: OnUnauthorized;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: 'Invalid server response',
      statusCode: res.status,
    };
  }
}

export function createApiClient(options: ApiClientOptions) {
  const fetchFn = options.fetchImpl ?? fetch;

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = options.getToken ? await options.getToken() : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetchFn(`${options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      options.onUnauthorized?.();
    }

    const body = await parseJson<T>(res);

    if (!res.ok || body.success === false) {
      const errBody = body as { message?: string; errors?: Record<string, string[]> };
      throw new ApiError(
        errBody.message ?? `Request failed (${res.status})`,
        res.status,
        errBody.errors,
      );
    }

    return (body as { success: true; data: T }).data;
  }

  return {
    auth: {
      login: (payload: LoginRequest) =>
        request<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      me: () => request<AuthUser>('/auth/me'),
      logout: () =>
        request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    },
    customers: {
      list: (q?: string) =>
        request<PaginatedData<CustomerDto>>(
          `/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
        ),
      get: (id: string) => request<CustomerDto>(`/customers/${id}`),
      create: (payload: CreateCustomerRequest) =>
        request<CustomerDto>('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    suppliers: {
      list: (q?: string) =>
        request<PaginatedData<SupplierDto>>(
          `/suppliers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
        ),
      get: (id: string) => request<SupplierDto>(`/suppliers/${id}`),
      create: (payload: CreateSupplierRequest) =>
        request<SupplierDto>('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    products: {
      list: (q?: string) =>
        request<PaginatedData<ProductDto>>(
          `/products${q ? `?q=${encodeURIComponent(q)}` : ''}`,
        ),
      get: (id: string) => request<ProductDto>(`/products/${id}`),
      create: (payload: CreateProductRequest) =>
        request<ProductDto>('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    sales: {
      list: () => request<PaginatedData<SaleDto>>('/sales'),
      get: (id: string) => request<SaleDto>(`/sales/${id}`),
      create: (payload: CreateSaleRequest) =>
        request<SaleDto>('/sales', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    purchases: {
      list: () => request<PaginatedData<PurchaseDto>>('/purchases'),
      get: (id: string) => request<PurchaseDto>(`/purchases/${id}`),
      create: (payload: CreatePurchaseRequest) =>
        request<PurchaseDto>('/purchases', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    payments: {
      list: () => request<PaginatedData<PaymentDto>>('/payments'),
      create: (payload: CreatePaymentRequest) =>
        request<PaymentDto>('/payments', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    expenses: {
      list: () => request<PaginatedData<ExpenseDto>>('/expenses'),
      create: (payload: CreateExpenseRequest) =>
        request<ExpenseDto>('/expenses', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
    },
    ledger: {
      customer: (customerId: string) =>
        request<PaginatedData<LedgerEntryDto>>(
          `/ledger/customers/${customerId}`,
        ),
      supplier: (supplierId: string) =>
        request<PaginatedData<LedgerEntryDto>>(
          `/ledger/suppliers/${supplierId}`,
        ),
    },
    cash: {
      roznamcha: (date?: string) =>
        request<RoznamchaSummaryDto>(
          `/cash/roznamcha${date ? `?date=${encodeURIComponent(date)}` : ''}`,
        ),
      balance: () => request<{ balance: string }>('/cash/balance'),
    },
    dashboard: {
      summary: () => request<DashboardSummaryDto>('/dashboard/summary'),
    },
    reports: {
      // Placeholders — full report implementations come later
      health: () => request<{ ready: true }>('/reports/health'),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
