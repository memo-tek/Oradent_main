import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, generateInvoiceNumber, slugify } from '../src/utils/formatters';

describe('formatCurrency', () => {
  it('formats USD amounts correctly', () => {
    expect(formatCurrency(1250)).toBe('$1,250.00');
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(99.9)).toBe('$99.90');
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
  });

  it('handles decimal precision', () => {
    expect(formatCurrency(19.999)).toBe('$20.00');
    expect(formatCurrency(0.01)).toBe('$0.01');
  });
});

describe('formatDate', () => {
  it('formats Date objects', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toContain('Mar');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2025');
  });

  it('formats date strings', () => {
    const formatted = formatDate('2024-12-25');
    expect(formatted).toContain('Dec');
    expect(formatted).toContain('25');
    expect(formatted).toContain('2024');
  });
});

describe('generateInvoiceNumber', () => {
  it('generates invoice numbers in the correct format', () => {
    const number = generateInvoiceNumber();
    expect(number).toMatch(/^INV-\d{6}-\d{4}$/);
  });

  it('generates unique numbers', () => {
    const numbers = new Set(Array.from({ length: 100 }, () => generateInvoiceNumber()));
    // With 10000 possible randoms, 100 samples should be mostly unique
    expect(numbers.size).toBeGreaterThan(90);
  });
});

describe('slugify', () => {
  it('converts text to slug format', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Dental Crown Procedure')).toBe('dental-crown-procedure');
  });

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('Test @#$ String')).toBe('test-string');
  });

  it('handles edge cases', () => {
    expect(slugify('  leading spaces  ')).toBe('leading-spaces');
    expect(slugify('multiple---dashes')).toBe('multiple-dashes');
    expect(slugify('UPPERCASE')).toBe('uppercase');
  });
});
