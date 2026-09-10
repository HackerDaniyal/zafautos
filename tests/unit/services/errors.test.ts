import { describe, it, expect } from 'vitest';
import {
  DomainError,
  UserNotFoundError,
  UserAlreadyExistsError,
  InvalidCredentialsError,
  SessionExpiredError,
  UnauthorizedError,
  VehicleNotFoundError,
  OrderNotFoundError,
  PaymentNotFoundError,
  ShipmentNotFoundError,
  SupportTicketNotFoundError,
  ConflictError,
  ValidationError,
} from '@/server/services/errors';

describe('DomainError', () => {
  it('has correct name, message, and code', () => {
    const error = new DomainError('Something went wrong', 'SOME_CODE');
    expect(error.name).toBe('DomainError');
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe('SOME_CODE');
  });

  it('extends Error', () => {
    const error = new DomainError('test', 'CODE');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('UserNotFoundError', () => {
  it('has code USER_NOT_FOUND', () => {
    const error = new UserNotFoundError('user-123');
    expect(error.code).toBe('USER_NOT_FOUND');
    expect(error.message).toBe('User not found: user-123');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('UserAlreadyExistsError', () => {
  it('has code USER_ALREADY_EXISTS', () => {
    const error = new UserAlreadyExistsError('test@example.com');
    expect(error.code).toBe('USER_ALREADY_EXISTS');
    expect(error.message).toBe('User already exists with email: test@example.com');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('InvalidCredentialsError', () => {
  it('has code INVALID_CREDENTIALS', () => {
    const error = new InvalidCredentialsError();
    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.message).toBe('Invalid credentials');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('SessionExpiredError', () => {
  it('has code SESSION_EXPIRED', () => {
    const error = new SessionExpiredError();
    expect(error.code).toBe('SESSION_EXPIRED');
    expect(error.message).toBe('Session has expired');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('UnauthorizedError', () => {
  it('has code UNAUTHORIZED', () => {
    const error = new UnauthorizedError();
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Unauthorized');
    expect(error).toBeInstanceOf(DomainError);
  });

  it('includes action in message when provided', () => {
    const error = new UnauthorizedError('delete user');
    expect(error.message).toBe('Unauthorized to perform: delete user');
  });
});

describe('VehicleNotFoundError', () => {
  it('has code VEHICLE_NOT_FOUND', () => {
    const error = new VehicleNotFoundError('vehicle-1');
    expect(error.code).toBe('VEHICLE_NOT_FOUND');
    expect(error.message).toBe('Vehicle not found: vehicle-1');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('OrderNotFoundError', () => {
  it('has code ORDER_NOT_FOUND', () => {
    const error = new OrderNotFoundError('order-1');
    expect(error.code).toBe('ORDER_NOT_FOUND');
    expect(error.message).toBe('Order not found: order-1');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('PaymentNotFoundError', () => {
  it('has code PAYMENT_NOT_FOUND', () => {
    const error = new PaymentNotFoundError('pay-1');
    expect(error.code).toBe('PAYMENT_NOT_FOUND');
    expect(error.message).toBe('Payment not found: pay-1');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('ShipmentNotFoundError', () => {
  it('has code SHIPMENT_NOT_FOUND', () => {
    const error = new ShipmentNotFoundError('ship-1');
    expect(error.code).toBe('SHIPMENT_NOT_FOUND');
    expect(error.message).toBe('Shipment not found: ship-1');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('SupportTicketNotFoundError', () => {
  it('has code SUPPORT_TICKET_NOT_FOUND', () => {
    const error = new SupportTicketNotFoundError('ticket-1');
    expect(error.code).toBe('SUPPORT_TICKET_NOT_FOUND');
    expect(error.message).toBe('Support ticket not found: ticket-1');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('ConflictError', () => {
  it('has code CONFLICT', () => {
    const error = new ConflictError('Resource conflict');
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Resource conflict');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('ValidationError', () => {
  it('has code VALIDATION_ERROR', () => {
    const error = new ValidationError('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
    expect(error).toBeInstanceOf(DomainError);
  });
});

describe('All domain errors extend Error', () => {
  const errorClasses = [
    { name: 'UserNotFoundError', create: () => new UserNotFoundError('1') },
    { name: 'UserAlreadyExistsError', create: () => new UserAlreadyExistsError('a@b.com') },
    { name: 'InvalidCredentialsError', create: () => new InvalidCredentialsError() },
    { name: 'SessionExpiredError', create: () => new SessionExpiredError() },
    { name: 'UnauthorizedError', create: () => new UnauthorizedError() },
    { name: 'VehicleNotFoundError', create: () => new VehicleNotFoundError('1') },
    { name: 'OrderNotFoundError', create: () => new OrderNotFoundError('1') },
    { name: 'PaymentNotFoundError', create: () => new PaymentNotFoundError('1') },
    { name: 'ShipmentNotFoundError', create: () => new ShipmentNotFoundError('1') },
    { name: 'SupportTicketNotFoundError', create: () => new SupportTicketNotFoundError('1') },
    { name: 'ConflictError', create: () => new ConflictError('msg') },
    { name: 'ValidationError', create: () => new ValidationError('msg') },
  ];

  it.each(errorClasses)('$name extends Error', ({ create }) => {
    const error = create();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });
});
