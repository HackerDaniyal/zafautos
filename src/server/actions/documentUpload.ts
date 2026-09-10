'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { uploadFile, getPublicUrl, STORAGE_BUCKETS } from '@/lib/supabase/storage';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { randomUUID } from 'crypto';

const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadOrderDocument(
  orderId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string; path: string }>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.update');

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return { success: false, error: 'File size exceeds 20MB limit' };
    }

    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      return { success: false, error: `File type "${file.type}" is not allowed` };
    }

    const ext = file.name.split('.').pop() || 'bin';
    const path = `orders/${orderId}/${randomUUID()}.${ext}`;

    const bytes = await file.arrayBuffer();
    await uploadFile(STORAGE_BUCKETS.documents, path, Buffer.from(bytes), {
      contentType: file.type,
    });

    const url = getPublicUrl(STORAGE_BUCKETS.documents, path);

    return { success: true, data: { url, path } };
  } catch (error) {
    return handleError(error);
  }
}
