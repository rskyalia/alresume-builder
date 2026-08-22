import { describe, expect, it } from 'vitest';
import { cn, formatDate, getCookie, truncate } from '../utils';

describe('cn', () => {
  it('menggabungkan class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('mengabaikan nilai falsy', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  it('meresolusi konflik class tailwind', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('formatDate', () => {
  it('memformat ISO date menjadi bulan + tahun', () => {
    expect(formatDate('2024-06-15')).toBe('Jun 2024');
  });

  it('mengembalikan string asli untuk tanggal tidak valid', () => {
    expect(formatDate('bukan-tanggal')).toBe('bukan-tanggal');
  });
});

describe('truncate', () => {
  it('tidak memotong string pendek', () => {
    expect(truncate('hai', 10)).toBe('hai');
  });

  it('memotong string panjang dan menambah elipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('tepat pada batas maksimal tidak dipotong', () => {
    expect(truncate('abcde', 5)).toBe('abcde');
  });
});

describe('getCookie', () => {
  it('membaca nilai cookie yang ada', () => {
    document.cookie = 'token=abc123; path=/';
    document.cookie = 'is_authenticated=1; path=/';

    expect(getCookie('token')).toBe('abc123');
    expect(getCookie('is_authenticated')).toBe('1');

    document.cookie = 'token=; path=/; max-age=0';
    document.cookie = 'is_authenticated=; path=/; max-age=0';
  });

  it('mengembalikan undefined untuk cookie tidak ada', () => {
    expect(getCookie('tidak_ada')).toBeUndefined();
  });
});
