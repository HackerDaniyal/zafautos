import { CustomerRepository } from '@/server/repositories';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { CustomerNotFoundError, ValidationError } from './errors';
import { isValidCustomerTransition, type CustomerStatus } from '@/lib/types/customer';

// ──────────────────────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────────────────────

export const CreateAddressSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  addressLine: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  postalCode: z.string().optional().nullable(),
});
export type CreateAddressDTO = z.infer<typeof CreateAddressSchema>;

export const CreateAlertSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  message: z.string().min(1, 'Message is required'),
});
export type CreateAlertDTO = z.infer<typeof CreateAlertSchema>;

export const UpdateSettingsSchema = z.object({
  preferences: z.string().optional().nullable(),
});
export type UpdateSettingsDTO = z.infer<typeof UpdateSettingsSchema>;

// ──────────────────────────────────────────────────────────────
// Service Layer
// ──────────────────────────────────────────────────────────────

export class CustomerService {
  constructor(private readonly customerRepo: CustomerRepository = new CustomerRepository()) {}

  /**
   * Retrieves a customer profile by their user ID.
   */
  async getCustomerByUserId(userId: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const customer = await this.customerRepo.findByUserId(userId);
    if (!customer) {
      throw new CustomerNotFoundError(userId);
    }
    return customer;
  }

  async getCustomerForEdit(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }
    const result = await this.customerRepo.getCustomerForEdit(customerId);
    if (!result) {
      throw new CustomerNotFoundError(customerId);
    }
    return result;
  }

  /**
   * Lists customers with filtering, pagination, and sorting.
   */
  async listCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    countryId?: string;
    dateFrom?: string;
    dateTo?: string;
    hasOrders?: boolean;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    return this.customerRepo.listCustomers(params);
  }

  /**
   * Returns a customer with all related data.
   */
  async getCustomerDetail(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const customer = await this.customerRepo.getCustomerWithDetails(customerId);
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }
    return customer;
  }

  /**
   * Returns customer statistics.
   */
  async getCustomerStats() {
    return this.customerRepo.getCustomerStats();
  }

  /**
   * Changes customer status with validation.
   */
  async changeCustomerStatus(
    customerId: string,
    newStatus: CustomerStatus,
    userId?: string,
    note?: string,
  ) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const customer = await this.customerRepo.customers.findById(customerId) as unknown as { id: string; userId: string } | null;
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    const userResult = await this.customerRepo.customers.getClient()
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, customer.userId))
      .limit(1);

    const user = userResult[0] as { status: string } | undefined;
    const currentStatus = (user?.status ?? 'active') as CustomerStatus;

    if (!isValidCustomerTransition(currentStatus, newStatus)) {
      throw new ValidationError(`Invalid status transition: ${currentStatus} → ${newStatus}`);
    }

    await this.customerRepo.updateUserStatus(customer.userId, newStatus);
    return { success: true };
  }

  /**
   * Soft deletes a customer.
   */
  async softDeleteCustomer(customerId: string, userId?: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const customer = await this.customerRepo.customers.findById(customerId) as unknown as { deletedAt: Date | null } | null;
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    if (customer.deletedAt) {
      throw new ValidationError('Customer is already deleted');
    }

    return this.customerRepo.softDeleteCustomer(customerId, userId);
  }

  /**
   * Restores a soft-deleted customer.
   */
  async restoreCustomer(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const customer = await this.customerRepo.customers.findById(customerId) as unknown as { deletedAt: Date | null } | null;
    if (!customer) {
      throw new CustomerNotFoundError(customerId);
    }

    if (!customer.deletedAt) {
      throw new ValidationError('Customer is not deleted');
    }

    return this.customerRepo.restoreCustomer(customerId);
  }

  /**
   * Bulk updates status for multiple customers.
   */
  async bulkUpdateStatus(ids: string[], status: CustomerStatus, userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.changeCustomerStatus(id, status, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }

  /**
   * Bulk soft deletes multiple customers.
   */
  async bulkDelete(ids: string[], userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.softDeleteCustomer(id, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }

  /**
   * Updates or creates a customer profile.
   */
  async upsertProfile(customerId: string, data: { displayName?: string | null }) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const existing = await this.customerRepo.profiles.findById(customerId);
    if (existing) {
      return this.customerRepo.profiles.update(customerId, {
        displayName: data.displayName,
        updatedAt: new Date(),
      } as never);
    }

    return this.customerRepo.profiles.create({
      customerId,
      displayName: data.displayName ?? null,
    } as never);
  }

  /**
   * Removes an address by its ID.
   */
  async removeAddress(addressId: string) {
    if (!addressId) {
      throw new ValidationError('Address ID is required');
    }
    return this.customerRepo.addresses.delete(addressId);
  }

  /**
   * Retrieves a customer's wishlist.
   */
  async getWishlist(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }
    return this.customerRepo.getWishlist(customerId);
  }

  /**
   * Adds a vehicle to a customer's wishlist.
   */
  async addToWishlist(customerId: string, vehicleId: string) {
    if (!customerId || !vehicleId) {
      throw new ValidationError('Customer ID and Vehicle ID are required');
    }
    return this.customerRepo.addWishlistEntry(customerId, vehicleId);
  }

  /**
   * Removes a vehicle from a customer's wishlist.
   */
  async removeFromWishlist(customerId: string, vehicleId: string) {
    if (!customerId || !vehicleId) {
      throw new ValidationError('Customer ID and Vehicle ID are required');
    }
    return this.customerRepo.removeWishlistEntry(customerId, vehicleId);
  }

  /**
   * Retrieves all addresses for a customer.
   */
  async getAddresses(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }
    return this.customerRepo.getAddresses(customerId);
  }

  /**
   * Creates a new address for a customer.
   */
  async createAddress(data: CreateAddressDTO) {
    const validatedData = CreateAddressSchema.parse(data);
    return this.customerRepo.createAddress(validatedData as unknown as Parameters<typeof this.customerRepo.createAddress>[0]);
  }

  /**
   * Creates an alert for a customer.
   */
  async createAlert(data: CreateAlertDTO) {
    const validatedData = CreateAlertSchema.parse(data);
    return this.customerRepo.createAlert(validatedData as unknown as Parameters<typeof this.customerRepo.createAlert>[0]);
  }

  /**
   * Updates customer settings/preferences.
   */
  async updateSettings(customerId: string, data: UpdateSettingsDTO) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }

    const validatedData = UpdateSettingsSchema.parse(data);

    const updated = await this.customerRepo.updateSettings(
      customerId,
      validatedData as unknown as Parameters<typeof this.customerRepo.updateSettings>[1],
    );

    if (!updated) {
      throw new CustomerNotFoundError(customerId);
    }

    return updated;
  }
}
