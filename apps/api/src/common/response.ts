export function ok<T>(data: T, message?: string) {
  return {
    success: true as const,
    data,
    ...(message ? { message } : {}),
  };
}

export function paginate<T>(
  items: T[],
  total: number,
  page = 1,
  pageSize = 50,
) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
