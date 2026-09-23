'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { DocumentService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { uploadFile, getSignedUrl, STORAGE_BUCKETS } from '@/lib/supabase/storage';
import { validateUploadFile, UPLOAD_CATEGORIES } from '@/lib/supabase/upload-validation';
import { z } from 'zod';

const documentService = new DocumentService();
const auditService = new AuditService();

export async function uploadDocumentFile(formData: FormData): Promise<ActionResult<{ url: string; fileType: string; fileSize: number }>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: 'No file provided', code: 'VALIDATION_ERROR' };
    }

    const validation = await validateUploadFile(file, 'adminDocuments');
    if (!validation.valid) {
      return { success: false, error: validation.reason, code: 'VALIDATION_ERROR' };
    }

    const path = `docs/${crypto.randomUUID()}.${validation.safeExtension}`;
    const result = await uploadFile(STORAGE_BUCKETS.documents, path, validation.buffer, {
      contentType: validation.claimedType,
      maxFileSize: UPLOAD_CATEGORIES.adminDocuments.maxBytes,
      upsert: false,
    });

    const url = await getSignedUrl(STORAGE_BUCKETS.documents, result.path);

    await auditService.logAction({
      action: 'document.file_uploaded',
      entityType: 'document',
      entityId: result.path,
      entityLabel: file.name,
      metadata: { fileName: file.name, fileSize: file.size },
    });

    return { success: true, data: { url, fileType: validation.claimedType, fileSize: validation.buffer.byteLength } };
  } catch (error) {
    return handleError(error);
  }
}

const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  documentUrl: z.string().url('Invalid file URL'),
  vehicleId: z.string().uuid('Invalid vehicle ID').optional().nullable(),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
  createdBy: z.string().uuid().optional().nullable(),
  updatedBy: z.string().uuid().optional().nullable(),
});

export async function listDocuments(options: {
  page?: number;
  limit?: number;
  search?: string;
} = {}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await documentService.listDocuments(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getDocument(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await documentService.getDocument(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function listDocumentCategories(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.read');
    const data = await documentService.listDocumentCategories();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createDocumentCategory(data: { name: string }): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const created = await documentService.createDocumentCategory(data);
    await auditService.logAction({
      action: 'document_category.created',
      entityType: 'document_category',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function createDocument(data: z.infer<typeof CreateDocumentSchema>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const validated = CreateDocumentSchema.parse(data);
    const created = await documentService.createDocument({
      title: validated.title,
      documentUrl: validated.documentUrl,
      vehicleId: validated.vehicleId,
      userId: validated.userId,
      createdBy: auth.userId,
    });
    await auditService.logAction({
      action: 'document.created',
      entityType: 'document',
      entityId: (created as { id: string }).id,
      entityLabel: validated.title,
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDocument(id: string, data: Partial<z.infer<typeof CreateDocumentSchema>>): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    const updated = await documentService.updateDocument(id, {
      ...data,
      updatedBy: auth.userId,
    });
    await auditService.logAction({
      action: 'document.updated',
      entityType: 'document',
      entityId: id,
      entityLabel: data.title ?? 'Document',
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    await documentService.deleteDocument(id);
    await auditService.logAction({
      action: 'document.deleted',
      entityType: 'document',
      entityId: id,
      entityLabel: 'Document',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreDocument(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'settings.update');
    await documentService.restoreDocument(id);
    await auditService.logAction({
      action: 'document.restored',
      entityType: 'document',
      entityId: id,
      entityLabel: 'Document',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
