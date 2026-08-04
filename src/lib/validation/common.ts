import { z } from 'zod';

/**
 * Reusable Zod UUID schema for validating UUID strings.
 */
export const UUIDSchema = z.string().uuid('Invalid ID');

/**
 * Shared schema for profile update DTOs.
 */
export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
});
