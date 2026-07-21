import { randomInt } from 'crypto';

export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomIntRange(min: number, max: number): number {
  return randomInt(min, max + 1);
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

export function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const usedVins = new Set<string>();

export function generateVin(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin: string;
  do {
    vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (usedVins.has(vin));
  usedVins.add(vin);
  return vin;
}

export function resetUsedVins() {
  usedVins.clear();
}

export function generateStockNumber(index: number): string {
  return `ZA-${new Date().getFullYear()}-${String(index).padStart(3, '0')}`;
}

const usedEmails = new Set<string>();

export function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  let attempt = 0;
  let email: string;
  do {
    const suffix = attempt > 0 ? attempt : '';
    email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@${randomItem(domains)}`;
    attempt++;
  } while (usedEmails.has(email));
  usedEmails.add(email);
  return email;
}

export function resetUsedEmails() {
  usedEmails.clear();
}

export function generatePhone(): string {
  const prefixes = ['070', '080', '090'];
  let num = randomItem(prefixes);
  for (let i = 0; i < 8; i++) {
    num += String(Math.floor(Math.random() * 10));
  }
  return num;
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}
