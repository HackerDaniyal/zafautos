'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import { uploadFile, getSignedUrl, STORAGE_BUCKETS } from '@/lib/supabase/storage';
import { validateUploadFile, UPLOAD_CATEGORIES } from '@/lib/supabase/upload-validation';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { UUIDSchema } from '@/lib/validation/common';
import { OrderRepository } from '@/server/repositories';
import { randomUUID } from 'crypto';

export async function uploadOrderDocument(
  orderId: string,
  formData: FormData,
): Promise<ActionResult<{ url: string; path: string }>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'orders.update');
    UUIDSchema.parse(orderId);

    const orderRepo = new OrderRepository();
    const order = await orderRepo.orders.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found', code: 'NOT_FOUND' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const validation = await validateUploadFile(file, 'orderDocuments');
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    const path = `orders/${orderId}/${randomUUID()}.${validation.safeExtension}`;
    await uploadFile(STORAGE_BUCKETS.documents, path, validation.buffer, {
      contentType: validation.claimedType,
      maxFileSize: UPLOAD_CATEGORIES.orderDocuments.maxBytes,
      upsert: false,
    });

    const url = await getSignedUrl(STORAGE_BUCKETS.documents, path);

    return { success: true, data: { url, path } };
  } catch (error) {
    return handleError(error);
  }
}
