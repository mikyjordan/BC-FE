/**
 * Identità visiva BusterCinema.
 * - Blu notte e navy per sfondo e superfici; interazioni ordinarie in blu/neutri.
 * - L'oro metallico è riservato a logo, Bustercoin, prezzi, guadagni e azioni economiche.
 */
export const theme = {
  colors: {
    bg: '#060A16',
    bgElevated: '#0A1022',
    surface: '#0F172E',
    surfaceAlt: '#141E3A',
    surfaceHover: '#1A2648',
    border: '#22305A',
    borderStrong: '#2F4174',
    text: '#FFFFFF',
    textSecondary: '#C3CBE0',
    textMuted: '#8592B3',
    primary: '#4F6BD8',
    primaryHover: '#6280F0',
    primarySoft: 'rgba(79, 107, 216, 0.16)',
    success: '#3FB984',
    successSoft: 'rgba(63, 185, 132, 0.14)',
    danger: '#E5566B',
    dangerSoft: 'rgba(229, 86, 107, 0.14)',
    warning: '#E8A13A',
    warningSoft: 'rgba(232, 161, 58, 0.14)',
    gold: '#E2B94B',
    goldLight: '#F7E49A',
    goldDeep: '#A57A22',
  },
  gradients: {
    gold: 'linear-gradient(135deg, #F7E49A 0%, #E2B94B 38%, #B8892B 68%, #F1D27A 100%)',
    goldText: 'linear-gradient(180deg, #FBEBA8 0%, #E7C25A 45%, #B5862A 100%)',
    hero: 'radial-gradient(1200px 400px at 10% -10%, rgba(79,107,216,0.22), transparent 60%), radial-gradient(900px 300px at 100% 0%, rgba(226,185,75,0.08), transparent 60%)',
  },
  fonts: {
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    display: "'Playfair Display', 'Bodoni 72', 'Didot', Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  radii: { sm: '8px', md: '12px', lg: '18px', pill: '999px' },
  shadow: {
    card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px rgba(0,0,0,0.35)',
    gold: '0 6px 24px rgba(226,185,75,0.25)',
  },
  layout: { sidebar: '248px', maxContent: '1240px', bottomNav: '64px' },
  bp: { sm: '600px', md: '900px', lg: '1200px' },
} as const;

export type AppTheme = typeof theme;
export const media = {
  sm: `@media (min-width: ${theme.bp.sm})`,
  md: `@media (min-width: ${theme.bp.md})`,
  lg: `@media (min-width: ${theme.bp.lg})`,
  mobile: `@media (max-width: calc(${theme.bp.md} - 1px))`,
};
