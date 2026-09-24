import { describe, it, expect } from 'vitest';
import { safeInternalPath } from '@/lib/security/safe-redirect';

describe('safeInternalPath', () => {
  it('accepts normal internal paths', () => {
    expect(safeInternalPath('/admin')).toBe('/admin');
    expect(safeInternalPath('/customer/orders?tab=1')).toBe('/customer/orders?tab=1');
    expect(safeInternalPath('/account/messages/123')).toBe('/account/messages/123');
  });

  it('returns null for missing/empty values', () => {
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
    expect(safeInternalPath('')).toBeNull();
    expect(safeInternalPath('   ')).toBeNull();
  });

  it('rejects absolute external URLs', () => {
    expect(safeInternalPath('https://evil.com')).toBeNull();
    expect(safeInternalPath('http://evil.com/path')).toBeNull();
    expect(safeInternalPath('javascript:alert(1)')).toBeNull();
  });

  it('rejects protocol-relative URLs', () => {
    expect(safeInternalPath('//evil.com')).toBeNull();
    expect(safeInternalPath('/\\evil.com')).toBeNull();
    expect(safeInternalPath('//evil.com/path')).toBeNull();
  });

  it('rejects encoded protocol-relative URLs', () => {
    expect(safeInternalPath('%2F%2Fevil.com')).toBeNull();
    expect(safeInternalPath('%2f%2fevil.com')).toBeNull();
  });

  it('rejects authority-like paths with @', () => {
    expect(safeInternalPath('/@evil.com')).toBeNull();
    expect(safeInternalPath('/user@evil.com')).toBeNull();
    expect(safeInternalPath('/path@https://evil.com')).toBeNull();
  });

  it('rejects backslashes and control characters', () => {
    expect(safeInternalPath('/admin\\..\\evil')).toBeNull();
    expect(safeInternalPath('/admin\nSet-Cookie: x')).toBeNull();
    expect(safeInternalPath('/admin\0evil')).toBeNull();
  });

  it('rejects values that do not start with /', () => {
    expect(safeInternalPath('admin')).toBeNull();
    expect(safeInternalPath('@evil.com')).toBeNull();
  });

  it('handles malformed percent-encoding safely', () => {
    expect(safeInternalPath('%E0%A4%A')).toBeNull();
  });
});
