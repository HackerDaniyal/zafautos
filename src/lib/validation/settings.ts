import { z } from 'zod';

export const CreateContinentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const UpdateContinentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const CreateCountrySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(2, 'Code is required').max(10),
  iso2: z.string().max(10).optional().nullable(),
  iso3: z.string().max(10).optional().nullable(),
  phoneCode: z.string().max(20).optional().nullable(),
  currencyCode: z.string().max(10).optional().nullable(),
  flagUrl: z.string().optional().nullable(),
  continentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const UpdateCountrySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(2).max(10).optional(),
  iso2: z.string().max(10).optional().nullable(),
  iso3: z.string().max(10).optional().nullable(),
  phoneCode: z.string().max(20).optional().nullable(),
  currencyCode: z.string().max(10).optional().nullable(),
  flagUrl: z.string().optional().nullable(),
  continentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
