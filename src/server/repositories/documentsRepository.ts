import { documentCategories, documents, documentVersions } from '@/server/db/schema';
import { type InferModel, eq, and, like, or, sql, desc, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { BaseRepository } from './baseRepository';

export class DocumentsRepository {
  public readonly documents = new BaseRepository(documents);
  public readonly categories = new BaseRepository(documentCategories);
  public readonly versions = new BaseRepository(documentVersions);

  async findByVehicleId(vehicleId: string) {
    return this.documents.getClient()
      .select()
      .from(documents)
      .where(eq(documents.vehicleId, vehicleId));
  }

  async createDocument(data: InferModel<typeof documents, 'insert'>) {
    return this.documents.create(data);
  }

  async createVersion(data: InferModel<typeof documentVersions, 'insert'>) {
    return this.versions.create(data);
  }

  async listDocuments(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, search } = options;

    const conditions: SQL[] = [sql`${documents.deletedAt} IS NULL`];

    if (search) {
      conditions.push(or(
        like(documents.title, `%${search}%`),
        like(documents.documentUrl, `%${search}%`),
      ) as SQL);
    }

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(documents)
      .where(whereClause);

    const data = await db
      .select({
        id: documents.id,
        title: documents.title,
        documentUrl: documents.documentUrl,
        vehicleId: documents.vehicleId,
        userId: documents.userId,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        createdBy: documents.createdBy,
      })
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }
}

