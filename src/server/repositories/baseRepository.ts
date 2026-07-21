import { db } from '@/server/db/client';
import { type InferModel, eq, and, or, like, sql, desc, asc, type SQL } from 'drizzle-orm';
import type { AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type RepositoryTable = AnyPgTable & { id: unknown };

type SelectFromArgument = Parameters<ReturnType<PostgresJsDatabase['select']>['from']>[0];

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SortOptions {
  column?: string;
  direction?: 'asc' | 'desc';
}

export interface FilterOptions {
  filters?: Record<string, unknown>;
  search?: string;
  searchColumns?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BaseRepository<Table extends RepositoryTable> {
  public readonly db: PostgresJsDatabase;
  protected readonly table: Table;

  constructor(table: Table, dbInstance: PostgresJsDatabase = db) {
    this.table = table;
    this.db = dbInstance;
  }

  public getClient() {
    return this.db;
  }

  private getIdColumn() {
    return (this.table as unknown as { id: Parameters<typeof eq>[0] }).id;
  }

  private getTableForQuery() {
    return this.table as unknown as SelectFromArgument;
  }

  async findAll() {
    return this.getClient().select().from(this.getTableForQuery());
  }

  async findByField(fieldName: string, value: unknown) {
    const table = this.table as unknown as Record<string, PgColumn>;
    const column = table[fieldName];
    if (!column) {
      throw new Error(`Column "${fieldName}" does not exist on table`);
    }
    const result = await this.getClient()
      .select()
      .from(this.getTableForQuery())
      .where(eq(column, value as never))
      .limit(1);

    return result[0] ?? null;
  }

  async findManyByField(fieldName: string, value: unknown) {
    const table = this.table as unknown as Record<string, PgColumn>;
    const column = table[fieldName];
    if (!column) {
      throw new Error(`Column "${fieldName}" does not exist on table`);
    }
    return this.getClient()
      .select()
      .from(this.getTableForQuery())
      .where(eq(column, value as never));
  }

  async findById(id: string) {
    const result = await this.getClient()
      .select()
      .from(this.getTableForQuery())
      .where(eq(this.getIdColumn(), id))
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: InferModel<Table, 'insert'>) {
    const [created] = await this.getClient().insert(this.table).values(data).returning();
    return created;
  }

  async update(id: string, data: Partial<InferModel<Table, 'insert'>>) {
    const [updated] = await this.getClient()
      .update(this.table)
      .set(data)
      .where(eq(this.getIdColumn(), id))
      .returning();

    return updated ?? null;
  }

  async delete(id: string) {
    return this.getClient().delete(this.table).where(eq(this.getIdColumn(), id));
  }

  async softDelete(id: string, deletedBy?: string) {
    return this.update(id, {
      deletedAt: new Date(),
      ...(deletedBy ? { deletedBy } : {}),
    } as Partial<InferModel<Table, 'insert'>>);
  }

  async findMany(options: {
    filters?: FilterOptions;
    pagination?: PaginationOptions;
    sort?: SortOptions;
    selectColumns?: PgColumn[];
  } = {}) {
    const { filters, pagination, sort, selectColumns } = options;
    const { page = 1, limit = 20 } = pagination ?? {};
    const { column: sortCol, direction = 'desc' } = sort ?? {};

    const conditions: SQL[] = [];

    // Always exclude soft-deleted records
    const table = this.table as unknown as Record<string, PgColumn>;
    if (table.deletedAt) {
      conditions.push(sql`${table.deletedAt} IS NULL`);
    }

    // Apply equality filters
    if (filters?.filters) {
      for (const [key, value] of Object.entries(filters.filters)) {
        if (table[key] && value !== undefined && value !== null && value !== '') {
          conditions.push(eq(table[key], value));
        }
      }
    }

    // Apply search
    if (filters?.search && filters.searchColumns?.length) {
      const searchConditions = filters.searchColumns.map((col) => {
        if (table[col]) {
          return like(table[col], `%${filters.search}%`);
        }
        return undefined;
      }).filter(Boolean) as SQL[];

      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions)!);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const [{ count }] = await this.getClient()
      .select({ count: sql<number>`count(*)::int` })
      .from(this.getTableForQuery())
      .where(whereClause);

    // Query
    let query = this.getClient()
      .select(selectColumns ? { columns: selectColumns as never } : undefined as never)
      .from(this.getTableForQuery())
      .where(whereClause);

    // Sort
    if (sortCol && table[sortCol]) {
      const sortFn = direction === 'asc' ? asc : desc;
      query = query.orderBy(sortFn(table[sortCol])) as typeof query;
    } else if (table.createdAt) {
      query = query.orderBy(desc(table.createdAt)) as typeof query;
    }

    // Paginate
    const offset = (page - 1) * limit;
    const data = await query.limit(limit).offset(offset);

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async count(filters?: Record<string, unknown>) {
    const table = this.table as unknown as Record<string, PgColumn>;
    const conditions: SQL[] = [];

    if (table.deletedAt) {
      conditions.push(sql`${table.deletedAt} IS NULL`);
    }

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (table[key] && value !== undefined && value !== null && value !== '') {
          conditions.push(eq(table[key], value));
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await this.getClient()
      .select({ count: sql<number>`count(*)::int` })
      .from(this.getTableForQuery())
      .where(whereClause);

    return count;
  }

  async exists(id: string) {
    const count = await this.count({ id } as Record<string, unknown>);
    return count > 0;
  }
}
