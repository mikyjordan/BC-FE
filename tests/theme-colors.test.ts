import { describe, expect, it } from '@jest/globals';
import { DEFAULT_COLORS, theme } from '../src/theme/theme';
import { cleanColors, isCssColor, mergeColors } from '../src/theme/ThemeColorsProvider';
import { colorGroups } from '../src/features/admin/ThemeColorsCard';

describe('colori del sito', () => {
  it('ogni colore di default è un colore CSS valido', () => {
    for (const [k, v] of Object.entries(DEFAULT_COLORS)) expect([k, isCssColor(v)]).toEqual([k, true]);
  });

  it('il pannello del Superadmin elenca tutti i colori, ognuno una sola volta', () => {
    const keys = colorGroups().flatMap((g) => g.keys.map((k) => k.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(Object.keys(DEFAULT_COLORS).sort());
  });

  it('i colori personalizzati sostituiscono solo quelli indicati', () => {
    const merged = mergeColors({ brand: '#000000' });
    expect(merged.brand).toBe('#000000');
    expect(merged.text).toBe(DEFAULT_COLORS.text);
    expect(theme.colors).toEqual(DEFAULT_COLORS);
  });

  it('scarta nomi sconosciuti e valori che non sono colori (niente CSS arbitrario)', () => {
    expect(
      cleanColors({ brand: ' #ff3366 ', overlay: 'rgba(1, 2, 3, 0.5)', text: 'red; background: url(x)', ignoto: '#ffffff', bg: 12 }),
    ).toEqual({ brand: '#ff3366', overlay: 'rgba(1, 2, 3, 0.5)' });
  });
});
