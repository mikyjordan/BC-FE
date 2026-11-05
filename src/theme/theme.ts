/**
 * Identità visiva BusterCinema — tema chiaro.
 * - Fondo #f2f2f2, superfici bianche.
 * - Header, footer e tab in blu #1a7cb6 con testo bianco (contrasto 4,6:1).
 * - L'oro è riservato ESCLUSIVAMENTE all'icona della moneta Bustercoin.
 * - Verde/rosso solo per guadagni/perdite e stati (sempre accompagnati da testo o simbolo).
 */
export const theme = {
  colors: {
    bg: '#F2F2F2',
    bgElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF3F8',
    surfaceHover: '#E2ECF4',
    border: '#D8DEE5',
    borderStrong: '#AEB9C5',
    text: '#17212B',
    textSecondary: '#384552',
    textMuted: '#5C6875',
    // Blu del marchio: header, footer, tab e azioni principali.
    brand: '#1A7CB6',
    brandDark: '#135F8C',
    brandDarker: '#0E4B6F',
    onBrand: '#FFFFFF',
    onBrandMuted: '#E3F1FA',
    primary: '#1A7CB6',
    primaryHover: '#135F8C',
    primarySoft: 'rgba(26, 124, 182, 0.12)',
    primaryText: '#145F8B',
    success: '#1B7F50',
    successSoft: '#E3F4EA',
    successBorder: '#9ED3B5',
    successText: '#146140',
    danger: '#C62F3E',
    dangerSoft: '#FCE6E8',
    dangerBorder: '#F0A9B0',
    dangerText: '#9E2230',
    warning: '#9A5B00',
    warningSoft: '#FFF2DB',
    warningBorder: '#F2C77F',
    infoSoft: '#E4F1FA',
    infoBorder: '#A9CFE7',
    overlay: 'rgba(15, 30, 45, 0.55)',
    // Solo per l'icona della moneta (CoinIcon ha i propri gradienti).
    gold: '#E2B94B',
    chart: ['#1A7CB6', '#7FB8DA'],
  },
  fonts: {
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display: "'Playfair Display', 'Bodoni 72', 'Didot', Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  radii: { sm: '8px', md: '12px', lg: '16px', pill: '999px' },
  shadow: {
    card: '0 1px 2px rgba(23, 33, 43, 0.06), 0 4px 14px rgba(23, 33, 43, 0.05)',
    raised: '0 18px 50px rgba(15, 30, 45, 0.25)',
  },
  layout: { sidebar: '240px', maxContent: '1240px', bottomNav: '64px', header: '60px' },
  bp: { sm: '600px', md: '900px', lg: '1200px' },
} as const;

export type AppTheme = typeof theme;
export const media = {
  sm: `@media (min-width: ${theme.bp.sm})`,
  md: `@media (min-width: ${theme.bp.md})`,
  lg: `@media (min-width: ${theme.bp.lg})`,
  mobile: `@media (max-width: calc(${theme.bp.md} - 1px))`,
};
