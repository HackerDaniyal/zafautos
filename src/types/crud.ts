export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: { column: string; direction: 'asc' | 'desc' };
  filters?: Record<string, unknown>;
}
