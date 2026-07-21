import { documentCategories, documents, documentVersions } from '@/server/db/schema';
import { type InferModel, eq } from 'drizzle-orm';
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
}
