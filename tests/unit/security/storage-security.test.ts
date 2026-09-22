import { describe, it, expect, vi } from 'vitest';

const mockSupabaseUrl = 'https://test.supabase.co';

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path', id: 'test-id' } }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.test' } }),
        createSignedUrls: vi.fn().mockResolvedValue({ data: [{ signedUrl: 'https://signed.test' }] }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        move: vi.fn().mockResolvedValue({ data: null, error: null }),
        copy: vi.fn().mockResolvedValue({ data: { path: 'test/path' } }),
      })),
    },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = mockSupabaseUrl;

const { getPublicUrl, getPrivateUrl, getSignedUrl, uploadFile, deleteFile, listFiles, createSignedUrls, PUBLIC_BUCKETS, PRIVATE_BUCKETS, ALLOWED_BUCKETS, StorageError } = await import('@/lib/supabase/storage');

describe('Storage Bucket Allowlist', () => {
  it('defines PUBLIC_BUCKETS with vehicles, media, avatars, flags', () => {
    expect(PUBLIC_BUCKETS.has('vehicles')).toBe(true);
    expect(PUBLIC_BUCKETS.has('media')).toBe(true);
    expect(PUBLIC_BUCKETS.has('avatars')).toBe(true);
    expect(PUBLIC_BUCKETS.has('flags')).toBe(true);
  });

  it('defines PRIVATE_BUCKETS with documents', () => {
    expect(PRIVATE_BUCKETS.has('documents')).toBe(true);
  });

  it('PUBLIC_BUCKETS and PRIVATE_BUCKETS are mutually exclusive', () => {
    for (const bucket of PUBLIC_BUCKETS) {
      expect(PRIVATE_BUCKETS.has(bucket)).toBe(false);
    }
  });

  it('ALLOWED_BUCKETS contains all public and private buckets', () => {
    expect(ALLOWED_BUCKETS.size).toBe(PUBLIC_BUCKETS.size + PRIVATE_BUCKETS.size);
  });
});

describe('getPublicUrl()', () => {
  it('generates public URL for public buckets', () => {
    const url = getPublicUrl('vehicles', 'vehicle-1/image.jpg');
    expect(url).toBe(`${mockSupabaseUrl}/storage/v1/object/public/vehicles/vehicle-1/image.jpg`);
  });

  it('generates public URL for media bucket', () => {
    const url = getPublicUrl('media', 'image.png');
    expect(url).toContain('/storage/v1/object/public/media/');
  });

  it('throws StorageError for private buckets', () => {
    expect(() => getPublicUrl('documents', 'doc.pdf')).toThrow(StorageError);
  });

  it('throws StorageError for disallowed buckets', () => {
    expect(() => getPublicUrl('unknown', 'file.txt')).toThrow(StorageError);
  });
});

describe('getPrivateUrl()', () => {
  it('returns storage path reference for private buckets', () => {
    const url = getPrivateUrl('documents', 'doc.pdf');
    expect(url).toBe(`${mockSupabaseUrl}/storage/v1/object/documents/doc.pdf`);
  });

  it('throws StorageError for public buckets', () => {
    expect(() => getPrivateUrl('vehicles', 'image.jpg')).toThrow(StorageError);
  });
});

describe('getSignedUrl()', () => {
  it('works for public buckets', async () => {
    const url = await getSignedUrl('vehicles', 'image.jpg');
    expect(url).toBe('https://signed.test');
  });

  it('works for private buckets', async () => {
    const url = await getSignedUrl('documents', 'doc.pdf');
    expect(url).toBe('https://signed.test');
  });

  it('throws StorageError for disallowed buckets', async () => {
    await expect(getSignedUrl('unknown', 'file.txt')).rejects.toThrow(StorageError);
  });
});

describe('uploadFile()', () => {
  it('works for public buckets', async () => {
    const result = await uploadFile('vehicles', 'image.jpg', Buffer.from('test'));
    expect(result.path).toBe('test/path');
  });

  it('works for private buckets', async () => {
    const result = await uploadFile('documents', 'doc.pdf', Buffer.from('test'));
    expect(result.path).toBe('test/path');
  });

  it('throws StorageError for disallowed buckets', async () => {
    await expect(uploadFile('unknown', 'file.txt', Buffer.from('test'))).rejects.toThrow(StorageError);
  });
});

describe('deleteFile()', () => {
  it('works for public buckets', async () => {
    await deleteFile('vehicles', ['image.jpg']);
  });

  it('works for private buckets', async () => {
    await deleteFile('documents', ['doc.pdf']);
  });

  it('throws StorageError for disallowed buckets', async () => {
    await expect(deleteFile('unknown', ['file.txt'])).rejects.toThrow(StorageError);
  });
});

describe('listFiles()', () => {
  it('works for public buckets', async () => {
    const files = await listFiles('vehicles');
    expect(files).toEqual([]);
  });

  it('works for private buckets', async () => {
    const files = await listFiles('documents');
    expect(files).toEqual([]);
  });

  it('throws StorageError for disallowed buckets', async () => {
    await expect(listFiles('unknown')).rejects.toThrow(StorageError);
  });
});

describe('createSignedUrls()', () => {
  it('works for public buckets', async () => {
    const urls = await createSignedUrls('vehicles', ['image.jpg']);
    expect(urls[0].signedUrl).toBe('https://signed.test');
  });

  it('throws StorageError for disallowed buckets', async () => {
    await expect(createSignedUrls('unknown', ['file.txt'])).rejects.toThrow(StorageError);
  });
});
