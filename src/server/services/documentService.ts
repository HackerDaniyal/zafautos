import { DocumentsRepository } from '@/server/repositories';
import { z } from 'zod';
import { DocumentNotFoundError, ValidationError } from './errors';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validation Schemas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  documentUrl: z.string().url('Invalid file URL'),
  vehicleId: z.string().uuid('Invalid vehicle ID').optional().nullable(),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
  createdBy: z.string().uuid().optional().nullable(),
  updatedBy: z.string().uuid().optional().nullable(),
});
export type CreateDocumentDTO = z.infer<typeof CreateDocumentSchema>;

export const CreateDocumentVersionSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  versionNumber: z.number().int().positive().default(1),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().nonnegative().default(0),
  changelog: z.string().optional().nullable(),
});
export type CreateDocumentVersionDTO = z.infer<typeof CreateDocumentVersionSchema>;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Service Layer
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class DocumentService {
  constructor(private readonly documentsRepo: DocumentsRepository = new DocumentsRepository()) {}

  /**
   * Retrieves all documents associated with a vehicle.
   */
  async getDocumentsByVehicleId(vehicleId: string) {
    if (!vehicleId) {
      throw new ValidationError('Vehicle ID is required');
    }
    return this.documentsRepo.findByVehicleId(vehicleId);
  }

  /**
   * Creates a new document record.
   */
  async createDocument(data: CreateDocumentDTO) {
    const validatedData = CreateDocumentSchema.parse(data);
    return this.documentsRepo.createDocument(validatedData as unknown as Parameters<typeof this.documentsRepo.createDocument>[0]);
  }

  /**
   * Adds a new version to an existing document.
   */
  async createDocumentVersion(data: CreateDocumentVersionDTO) {
    const validatedData = CreateDocumentVersionSchema.parse(data);

    // Verify document exists
    const document = await this.documentsRepo.documents.findById(validatedData.documentId);
    if (!document) {
      throw new DocumentNotFoundError(validatedData.documentId);
    }

    return this.documentsRepo.createVersion(validatedData as unknown as Parameters<typeof this.documentsRepo.createVersion>[0]);
  }

  /**
   * Lists all documents with filtering and pagination.
   */
  async listDocuments(options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    return this.documentsRepo.listDocuments(options);
  }

  /**
   * Gets a single document by ID.
   */
  async getDocument(id: string) {
    const document = await this.documentsRepo.documents.findById(id);
    if (!document) {
      throw new DocumentNotFoundError(id);
    }
    return document;
  }

  /**
   * Updates an existing document record.
   */
  async updateDocument(id: string, data: Partial<CreateDocumentDTO>) {
    const validatedData = CreateDocumentSchema.partial().parse(data);
    return this.documentsRepo.documents.update(id, validatedData);
  }

  /**
   * Soft-deletes a document.
   */
  async deleteDocument(id: string) {
    return this.documentsRepo.documents.softDelete(id);
  }

  /**
   * Restores a soft-deleted document.
   */
  async restoreDocument(id: string) {
    return this.documentsRepo.documents.update(id, { deletedAt: null, deletedBy: null });
  }

  /**
   * Lists all document categories.
   */
  async listDocumentCategories() {
    return this.documentsRepo.categories.findAll();
  }

  /**
   * Creates a new document category.
   */
  async createDocumentCategory(data: { name: string }) {
    if (!data.name?.trim()) throw new ValidationError('Category name is required');
    return this.documentsRepo.categories.create({ name: data.name.trim() } as unknown as Parameters<typeof this.documentsRepo.categories.create>[0]);
  }
}
