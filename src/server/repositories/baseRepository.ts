import { db } from '@/server/db/client';
import type { InferModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import type { AnyPgTable } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type RepositoryTable = AnyPgTable & { id: unknown };

type SelectFromArgument = Parameters<ReturnType<PostgresJsDatabase['select']>['from']>[0];

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
}
