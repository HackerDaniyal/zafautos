import { DocumentsRepository } from '@/server/repositories';
import { z } from 'zod';
import { DocumentNotFoundError, ValidationError } from './errors';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validation Schemas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  categoryId: z.string().uuid('Invalid category ID').optional().nullable(),
  vehicleId: z.string().uuid('Invalid vehicle ID').optional().nullable(),
  fileUrl: z.string().url('Invalid file URL'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().nonnegative().default(0),
  status: z.enum(['active', 'archived', 'draft']).default('active'),
  isPublic: z.boolean().default(false),
  requiresSignature: z.boolean().default(false),
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
}
