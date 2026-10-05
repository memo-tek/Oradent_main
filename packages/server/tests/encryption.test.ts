import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/utils/encryption';

describe('encryption', () => {
  it('encrypts and decrypts a string correctly', () => {
    const original = 'SSN-123-45-6789';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':');
    expect(decrypt(encrypted)).toBe(original);
  });

  it('produces different ciphertexts for the same input (random IV)', () => {
    const text = 'member-id-ABC123';
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);
    expect(encrypted1).not.toBe(encrypted2);
    // But both decrypt to same value
    expect(decrypt(encrypted1)).toBe(text);
    expect(decrypt(encrypted2)).toBe(text);
  });

  it('handles empty strings', () => {
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('handles special characters and unicode', () => {
    const text = 'José García — allergic to penicillin & codeine (重要)';
    const encrypted = encrypt(text);
    expect(decrypt(encrypted)).toBe(text);
  });

  it('handles long strings', () => {
    const text = 'A'.repeat(10000);
    const encrypted = encrypt(text);
    expect(decrypt(encrypted)).toBe(text);
  });

  it('throws on invalid encrypted text format', () => {
    expect(() => decrypt('not-valid')).toThrow('Invalid encrypted text format');
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('sensitive data');
    const parts = encrypted.split(':');
    parts[2] = parts[2].replace(/[a-f0-9]/, 'x');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });
});
