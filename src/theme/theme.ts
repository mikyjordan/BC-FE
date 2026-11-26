import defaultColors from './colors.config.json' with { type: 'json' };

/**
 * Identità visiva BusterCinema — tema "gioco": viola elettrico, magenta e accenti brillanti.
 *
 * TUTTI i colori del sito vivono in colors.config.json (colori di default). Il Superadmin può
 * cambiarli dall'area admin (Impostazioni → Colori del sito) e ripristinare i default: i colori
 * personalizzati arrivano dal backend e vengono sovrapposti a questi (vedi ThemeColorsProvider).
 * Nei componenti si usa sempre theme.colors.<nome>, mai un colore scritto direttamente.
 */
export type ThemeColors = typeof defaultColors;
export type ColorKey = keyof ThemeColors;
export const DEFAULT_COLORS: ThemeColors = defaultColors;

export function buildTheme(colors: ThemeColors) {
  return {
    ...baseTheme,
    colors,
    shadow: {
      card: `0 1px 2px ${colors.shadow}, 0 4px 14px ${colors.shadow}`,
      raised: `0 18px 50px ${colors.shadowStrong}`,
    },
  };
}

const baseTheme = {
  fonts: {
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display: "'Playfair Display', 'Bodoni 72', 'Didot', Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  radii: { sm: '8px', md: '12px', lg: '16px', pill: '999px' },
  layout: { sidebar: '240px', maxContent: '1240px', bottomNav: '64px', header: '60px' },
  bp: { sm: '600px', md: '900px', lg: '1200px' },
} as const;

export const theme = buildTheme(DEFAULT_COLORS);
export type AppTheme = typeof theme;
export const media = {
  sm: `@media (min-width: ${theme.bp.sm})`,
  md: `@media (min-width: ${theme.bp.md})`,
  lg: `@media (min-width: ${theme.bp.lg})`,
  mobile: `@media (max-width: calc(${theme.bp.md} - 1px))`,
};
