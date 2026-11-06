import { describe, expect, it } from 'vitest';
import { addDays, fromItalyInput, italyToday, toItalyInput } from '../src/components/time';
import { formatDateTime } from '../src/components/format';
import { dayBeforeReleaseAt2359 } from '../src/features/admin/DateTimeInput';

// Questi risultati non devono dipendere dal fuso del dispositivo: il test gira anche con
// TZ=America/New_York e TZ=Asia/Tokyo (vedi npm test) e deve dare gli stessi valori.
describe('ora italiana indipendente dal fuso del dispositivo', () => {
  it('i campi data/ora sono letti come ora italiana (inverno +1, estate +2)', () => {
    expect(fromItalyInput('2026-12-01T23:59')).toBe('2026-12-01T22:59:00.000Z');
    expect(fromItalyInput('2026-07-01T23:59')).toBe('2026-07-01T21:59:00.000Z');
    expect(toItalyInput('2026-12-01T22:59:00.000Z')).toBe('2026-12-01T23:59');
    expect(toItalyInput('2026-07-01T21:59:00.000Z')).toBe('2026-07-01T23:59');
  });

  it('andata e ritorno anche intorno ai cambi d’ora', () => {
    for (const v of ['2026-03-29T01:30', '2026-03-29T03:30', '2026-10-25T01:30', '2026-10-25T03:30', '2026-11-05T23:59']) {
      expect(toItalyInput(fromItalyInput(v))).toBe(v);
    }
  });

  it('giorno di calendario italiano, chiusura alle 23:59 del giorno prima, formattazione', () => {
    expect(italyToday(new Date('2026-11-05T23:30:00Z'))).toBe('2026-11-06'); // 00:30 in Italia
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(dayBeforeReleaseAt2359('2026-11-06')).toBe('2026-11-05T23:59');
    expect(formatDateTime('2026-11-05T22:59:00.000Z')).toMatch(/23:59/);
  });
});
