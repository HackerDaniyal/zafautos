/**
 * Typed domain errors for the ZafAutos service layer.
 *
 * All services throw these errors instead of raw Error instances, so that
 * API routes can distinguish error categories and map them to HTTP status codes.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Auth errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class UserNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`User already exists with email: ${email}`, 'USER_ALREADY_EXISTS');
    this.name = 'UserAlreadyExistsError';
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid credentials', 'INVALID_CREDENTIALS');
    this.name = 'InvalidCredentialsError';
  }
}

export class SessionExpiredError extends DomainError {
  constructor() {
    super('Session has expired', 'SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(action?: string) {
    super(
      action ? `Unauthorized to perform: ${action}` : 'Unauthorized',
      'UNAUTHORIZED',
    );
    this.name = 'UnauthorizedError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Vehicle errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class VehicleNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Vehicle not found: ${id}`, 'VEHICLE_NOT_FOUND');
    this.name = 'VehicleNotFoundError';
  }
}

export class VehicleAlreadyExistsError extends DomainError {
  constructor(vin: string) {
    super(`Vehicle with VIN already exists: ${vin}`, 'VEHICLE_ALREADY_EXISTS');
    this.name = 'VehicleAlreadyExistsError';
  }
}

export class VehicleNotAvailableError extends DomainError {
  constructor(id: string) {
    super(`Vehicle is not available for purchase: ${id}`, 'VEHICLE_NOT_AVAILABLE');
    this.name = 'VehicleNotAvailableError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Order errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class OrderNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Order not found: ${id}`, 'ORDER_NOT_FOUND');
    this.name = 'OrderNotFoundError';
  }
}

export class InvalidOrderStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Invalid status transition: ${from} â†’ ${to}`,
      'INVALID_ORDER_STATUS_TRANSITION',
    );
    this.name = 'InvalidOrderStatusTransitionError';
  }
}

export class OrderAlreadyCancelledError extends DomainError {
  constructor(id: string) {
    super(`Order is already cancelled: ${id}`, 'ORDER_ALREADY_CANCELLED');
    this.name = 'OrderAlreadyCancelledError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Customer errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class CustomerNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Customer not found: ${id}`, 'CUSTOMER_NOT_FOUND');
    this.name = 'CustomerNotFoundError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dealer errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class DealerNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Dealer not found: ${id}`, 'DEALER_NOT_FOUND');
    this.name = 'DealerNotFoundError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Payment errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class PaymentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Payment not found: ${id}`, 'PAYMENT_NOT_FOUND');
    this.name = 'PaymentNotFoundError';
  }
}

export class DuplicatePaymentError extends DomainError {
  constructor(orderId: string) {
    super(`A payment already exists for order: ${orderId}`, 'DUPLICATE_PAYMENT');
    this.name = 'DuplicatePaymentError';
  }
}

export class InvoiceNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Invoice not found: ${id}`, 'INVOICE_NOT_FOUND');
    this.name = 'InvoiceNotFoundError';
  }
}

export class DuplicateInvoiceError extends DomainError {
  constructor(invoiceNumber: string) {
    super(`Invoice already exists with number: ${invoiceNumber}`, 'DUPLICATE_INVOICE');
    this.name = 'DuplicateInvoiceError';
  }
}

export class InvalidInvoiceStatusTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Invalid invoice status transition: ${from} to ${to}`,
      'INVALID_INVOICE_STATUS_TRANSITION',
    );
    this.name = 'InvalidInvoiceStatusTransitionError';
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Transaction not found: ${id}`, 'TRANSACTION_NOT_FOUND');
    this.name = 'TransactionNotFoundError';
  }
}

export class InvalidRefundError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_REFUND');
    this.name = 'InvalidRefundError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Shipping errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class ShipmentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Shipment not found: ${id}`, 'SHIPMENT_NOT_FOUND');
    this.name = 'ShipmentNotFoundError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Document errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class DocumentNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Document not found: ${id}`, 'DOCUMENT_NOT_FOUND');
    this.name = 'DocumentNotFoundError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Settings errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class SettingNotFoundError extends DomainError {
  constructor(key: string) {
    super(`Setting not found: ${key}`, 'SETTING_NOT_FOUND');
    this.name = 'SettingNotFoundError';
  }
}

// CMS errors

export class CmsPageNotFoundError extends DomainError {
  constructor(id: string) {
    super(`CMS page not found: ${id}`, 'CMS_PAGE_NOT_FOUND');
    this.name = 'CmsPageNotFoundError';
  }
}

export class CmsPageSlugConflictError extends DomainError {
  constructor(slug: string) {
    super(`CMS page with slug "${slug}" already exists`, 'CMS_PAGE_SLUG_CONFLICT');
    this.name = 'CmsPageSlugConflictError';
  }
}

export class HomepageSectionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Homepage section not found: ${id}`, 'HOMEPAGE_SECTION_NOT_FOUND');
    this.name = 'HomepageSectionNotFoundError';
  }
}

export class MenuNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Menu not found: ${id}`, 'MENU_NOT_FOUND');
    this.name = 'MenuNotFoundError';
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Generic errors
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}
