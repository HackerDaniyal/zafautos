import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SCHEMA_DIR = path.resolve(__dirname, '../../../src/server/db/schema');

function readSchema(file: string): string {
  return fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf-8');
}

describe('Database Schema - Financial FK Constraints', () => {
  it('payments.orderId uses onDelete restrict', () => {
    const content = readSchema('payments.ts');
    const paymentMatch = content.match(/orderId:[\s\S]*?\.references[\s\S]*?\{[^}]*\}/);
    expect(paymentMatch?.[0]).toContain("'restrict'");
  });

  it('invoices.orderId uses onDelete restrict', () => {
    const content = readSchema('payments.ts');
    const invoiceSection = content.substring(content.indexOf('invoices'));
    const orderRef = invoiceSection.match(/orderId:[\s\S]*?\.references[\s\S]*?\{[^}]*\}/);
    expect(orderRef?.[0]).toContain("'restrict'");
  });

  it('payment_transactions.paymentId uses onDelete restrict', () => {
    const content = readSchema('payments.ts');
    const ptSection = content.substring(content.indexOf('paymentTransactions'));
    const paymentRef = ptSection.match(/paymentId:[\s\S]*?\.references[\s\S]*?\{[^}]*\}/);
    expect(paymentRef?.[0]).toContain("'restrict'");
  });

  it('payment_transactions.orderId uses onDelete restrict', () => {
    const content = readSchema('payments.ts');
    const ptSection = content.substring(content.indexOf('paymentTransactions'));
    const orderRef = ptSection.match(/orderId:[\s\S]*?\.references[\s\S]*?\{[^}]*\}/);
    expect(orderRef?.[0]).toContain("'restrict'");
  });

  it('shipments.orderId uses onDelete restrict', () => {
    const content = readSchema('shipping.ts');
    const shipmentRef = content.match(/orderId:[\s\S]*?\.references[\s\S]*?\{[^}]*\}/);
    expect(shipmentRef?.[0]).toContain("'restrict'");
  });

  it('vehicle_enquiries.vehicleId uses onDelete restrict', () => {
    const content = readSchema('marketplace.ts');
    const enquirySection = content.substring(content.indexOf('vehicleEnquiries'));
    const vehicleRef = enquirySection.match(/vehicleId:[\s\S]*?\.references[\s\S]*?\{[^}]*\}/);
    expect(vehicleRef?.[0]).toContain("'restrict'");
  });
});

describe('Database Schema - Numeric Precision', () => {
  it('exchange_rates.rate is numeric with precision (not integer)', () => {
    const content = readSchema('payments.ts');
    const rateSection = content.substring(content.indexOf('exchangeRates'));
    expect(rateSection).toContain("numeric('rate'");
    expect(rateSection).not.toMatch(/integer\('rate'/);
  });

  it('currencies.exchangeRate is numeric with precision', () => {
    const content = readSchema('payments.ts');
    const currencySection = content.substring(content.indexOf('currencies'));
    expect(currencySection).toContain("numeric('exchange_rate'");
  });
});

describe('Database Schema - Unique Indexes', () => {
  it('customers.userId has a unique index', () => {
    const content = readSchema('customers.ts');
    expect(content).toContain('uniqueIndex');
    expect(content).toMatch(/uniqueIndex\('customers_user_id_unique_idx'/);
  });

  it('dealers.userId has a unique index', () => {
    const content = readSchema('dealers.ts');
    expect(content).toContain('uniqueIndex');
    expect(content).toMatch(/uniqueIndex\('dealers_user_id_unique_idx'/);
  });

  it('customer_wishlist has composite unique on (customerId, vehicleId)', () => {
    const content = readSchema('customers.ts');
    expect(content).toMatch(/uniqueIndex\('customer_wishlist_customer_vehicle_unique_idx'\)\.on\(table\.customerId,\s*table\.vehicleId\)/);
  });

  it('vehicle_wishlist has composite unique on (userId, vehicleId)', () => {
    const content = readSchema('marketplace.ts');
    expect(content).toMatch(/uniqueIndex\('vehicle_wishlist_user_vehicle_unique_idx'\)\.on\(table\.userId,\s*table\.vehicleId\)/);
  });
});

describe('Database Schema - Composite Indexes on Vehicles', () => {
  it('vehicles has (status, isFeatured) composite index', () => {
    const content = readSchema('vehicles.ts');
    expect(content).toMatch(/index\('vehicles_status_featured_idx'\)\.on\(table\.status,\s*table\.isFeatured\)/);
  });

  it('vehicles has (status, manufacturerId, modelId) composite index', () => {
    const content = readSchema('vehicles.ts');
    expect(content).toMatch(/index\('vehicles_status_manufacturer_model_idx'\)\.on\(table\.status,\s*table\.manufacturerId,\s*table\.modelId\)/);
  });
});

describe('Database Schema - Date Indexes', () => {
  it('orders has createdAt index', () => {
    const content = readSchema('orders.ts');
    expect(content).toMatch(/index\('orders_created_at_idx'\)\.on\(table\.createdAt\)/);
  });

  it('invoices has dueDate index', () => {
    const content = readSchema('payments.ts');
    const invoiceSection = content.substring(content.indexOf('invoices'));
    expect(invoiceSection).toMatch(/index\('invoices_due_date_idx'\)\.on\(table\.dueDate\)/);
  });
});
