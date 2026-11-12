import { describe, expect, it } from '@jest/globals';
import { formatBc, formatPct } from '../src/components/format';
import { toPayload, toFormValues } from '../src/features/admin/content-fields';

describe('formattazione', () => {
  it('importi Bustercoin in formato italiano', () => {
    expect(formatBc(1_000_000)).toBe('1.000.000 B');
    expect(formatBc(250_000, true)).toBe('+250.000 B');
    expect(formatBc(-250_000, true)).toBe('-250.000 B');
  });
  it('percentuali con segno', () => {
    expect(formatPct(12.5)).toBe('+12,5%');
    expect(formatPct(0)).toBe('0%');
  });
});

describe('form contenuti amministrativi', () => {
  it('converte stringhe vuote in null, liste e numeri', () => {
    const values = toFormValues('movies');
    values.title = 'Titolo';
    values.genres = 'Dramma, Commedia ,';
    values.durationMinutes = '120';
    const p = toPayload('movies', values);
    expect(p.title).toBe('Titolo');
    expect(p.genres).toEqual(['Dramma', 'Commedia']);
    expect(p.durationMinutes).toBe(120);
    expect(p.director).toBeNull();
    expect(p).not.toHaveProperty('publicationStatus');
  });
});
