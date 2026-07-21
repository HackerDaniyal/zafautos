# Storage Buckets

## Bucket Configuration

| Bucket | Access | Max Size | Allowed Types |
|--------|--------|----------|---------------|
| `vehicle-images` | Public read, Auth write | 10MB | image/jpeg, image/png, image/webp |
| `vehicle-documents` | Auth read/write | 20MB | application/pdf, image/* |
| `customer-documents` | Owner read, Admin write | 20MB | application/pdf, image/* |
| `dealer-documents` | Dealer read, Admin write | 20MB | application/pdf, image/* |
| `payment-receipts` | Owner read, Admin write | 10MB | application/pdf, image/* |
| `shipping-documents` | Auth read, Admin write | 20MB | application/pdf |
| `avatars` | Public read, Owner write | 5MB | image/jpeg, image/png, image/webp |

## Path Structure

```
vehicle-images/
  {vehicle-id}/
    images/
      {uuid}.jpg
      {uuid}.png

vehicle-documents/
  {vehicle-id}/
    documents/
      {uuid}.pdf

customer-documents/
  {customer-id}/
    identity/
      {uuid}.pdf
    address-proof/
      {uuid}.pdf

avatars/
  {user-id}/
    avatar.{ext}
```

## Helper Functions

All in `src/lib/supabase/storage.ts`:

```typescript
uploadFile(bucket, path, file, options?)
deleteFile(bucket, paths)
getSignedUrl(bucket, path, expiresIn?)
getPublicUrl(bucket, path)
listFiles(bucket, prefix?, limit?)
moveFile(bucket, fromPath, toPath)
copyFile(bucket, fromPath, toPath)
createSignedUrls(bucket, paths, expiresIn?)
```

File validation in `src/lib/supabase/storage-helpers.ts`:

```typescript
validateFileType(file, allowedTypes)
validateFileSize(file, maxSizeMB)
getImageDimensions(file)
generateStoragePath(entityType, entityId, filename)
getFileExtension(filename)
```
