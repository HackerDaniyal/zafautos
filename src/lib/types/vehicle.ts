import type { vehicles, vehicleImages } from '@/server/db/schema';

// ── Core DB Types ──────────────────────────────────
export type Vehicle = typeof vehicles.$inferSelect;
export type VehicleInsert = typeof vehicles.$inferInsert;
export type VehicleImage = typeof vehicleImages.$inferSelect;

// ── Shared Enums ───────────────────────────────────
export type VehicleStatus = 'draft' | 'active' | 'sold' | 'archived';

// ── Shared DTOs ────────────────────────────────────
export interface VehicleWithImages extends Vehicle {
  images: VehicleImage[];
}

export interface VehicleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VehicleStatus;
  manufacturerId?: string;
  modelId?: string;
  bodyTypeId?: string;
  fuelTypeId?: string;
  transmissionId?: string;
  driveTypeId?: string;
  colorId?: string;
  countryId?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  isFeatured?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface VehicleFormData {
  vin?: string | null;
  stockNumber?: string | null;
  manufacturerId?: string | null;
  modelId?: string | null;
  bodyTypeId?: string | null;
  year?: number | null;
  condition?: string | null;
  price?: number | null;
  currencyId?: string | null;
  fuelTypeId?: string | null;
  transmissionId?: string | null;
  driveTypeId?: string | null;
  colorId?: string | null;
  engineCc?: number | null;
  horsepower?: number | null;
  mileage?: number | null;
  doors?: number | null;
  seats?: number | null;
  auctionGrade?: string | null;
  countryId?: string | null;
  portId?: string | null;
  features?: string[];
  specifications?: { name: string; value: string }[];
  status?: VehicleStatus;
  isFeatured?: boolean;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  notes?: string | null;
}
