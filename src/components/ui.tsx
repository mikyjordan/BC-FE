import styled, { css, keyframes } from 'styled-components';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { CoinIcon } from './brand/CoinIcon';
import { formatBc } from './format';
import { media } from '../theme/theme';
import { t, tx, LOCALE } from '../i18n';

/* ---------- Pulsanti ---------- */
type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';

export const Button = styled.button<{ $variant?: Variant; $size?: 'sm' | 'md'; $block?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, transform 0.05s, box-shadow 0.15s;
  padding: ${({ $size }) => ($size === 'sm' ? '6px 12px' : '10px 18px')};
  font-size: ${({ $size }) => ($size === 'sm' ? '0.85rem' : '0.95rem')};
  width: ${({ $block }) => ($block ? '100%' : 'auto')};
  &:active:not(:disabled) { transform: translateY(1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${({ $variant = 'primary', theme }) => {
    switch ($variant) {
      case 'gold':
        // Azioni economiche (acquisti, riscatti): stesso blu del marchio, più evidente.
        // L'oro resta solo sull'icona della moneta.
        return css`
          background: ${theme.colors.brand};
          color: ${theme.colors.onBrand};
          box-shadow: 0 2px 8px rgba(26, 124, 182, 0.3);
          &:hover:not(:disabled) { background: ${theme.colors.brandDark}; }
        `;
      case 'secondary':
        return css`
          background: ${theme.colors.surface};
          border-color: ${theme.colors.borderStrong};
          color: ${theme.colors.text};
          &:hover:not(:disabled) { background: ${theme.colors.surfaceHover}; border-color: ${theme.colors.borderStrong}; }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.textSecondary};
          &:hover:not(:disabled) { background: ${theme.colors.surfaceAlt}; color: ${theme.colors.text}; }
        `;
      case 'danger':
        return css`
          background: ${theme.colors.dangerSoft};
          border-color: ${theme.colors.dangerBorder};
          color: ${theme.colors.dangerText};
          &:hover:not(:disabled) { background: #F9D5D9; }
        `;
      default:
        return css`
          background: ${theme.colors.primary};
          color: #fff;
          &:hover:not(:disabled) { background: ${theme.colors.primaryHover}; }
        `;
    }
  }}
`;

/* ---------- Superfici ---------- */
export const Card = styled.section<{ $padding?: string }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: ${({ $padding }) => $padding ?? '20px'};
`;

export const Stack = styled.div<{ $gap?: number; $row?: boolean; $wrap?: boolean; $align?: string; $justify?: string }>`
  display: flex;
  flex-direction: ${({ $row }) => ($row ? 'row' : 'column')};
  gap: ${({ $gap = 12 }) => `${$gap}px`};
  flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};
  align-items: ${({ $align }) => $align ?? 'stretch'};
  justify-content: ${({ $justify }) => $justify ?? 'flex-start'};
  min-width: 0;
`;

export const Grid = styled.div<{ $min?: number; $gap?: number }>`
  display: grid;
  gap: ${({ $gap = 16 }) => `${$gap}px`};
  grid-template-columns: repeat(auto-fill, minmax(${({ $min = 160 }) => `${$min}px`}, 1fr));
`;

export const Muted = styled.p<{ $size?: string }>`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ $size }) => $size ?? '0.9rem'};
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
`;

/* ---------- Bustercoin ---------- */
const AmountWrap = styled.span<{ $size: number; $tone: 'gold' | 'positive' | 'negative' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $size }) => Math.round($size * 0.3)}px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  font-size: ${({ $size }) => `${$size}px`};
  color: ${({ $tone, theme }) => ($tone === 'negative' ? theme.colors.textSecondary : theme.colors.text)};
`;

/** Importo in Bustercoin, preceduto dall'icona della moneta (unico elemento in oro). */
export function Bc({ value, size = 15, signed = false }: { value: number; size?: number; signed?: boolean }) {
  const tone = signed && value < 0 ? 'negative' : signed && value > 0 ? 'positive' : 'gold';
  return (
    <AmountWrap $size={size} $tone={tone}>
      <CoinIcon size={Math.round(size * 1.25)} />
      <span>{formatBc(value, signed)}</span>
    </AmountWrap>
  );
}

/* ---------- Badge ---------- */
type Tone = 'neutral' | 'blue' | 'green' | 'red' | 'amber' | 'gold';
export const Badge = styled.span<{ $tone?: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  ${({ $tone = 'neutral', theme }) => {
    const map: Record<Tone, [string, string]> = {
      neutral: [theme.colors.surfaceAlt, theme.colors.textSecondary],
      blue: [theme.colors.infoSoft, theme.colors.primaryText],
      green: [theme.colors.successSoft, theme.colors.successText],
      red: [theme.colors.dangerSoft, theme.colors.dangerText],
      amber: [theme.colors.warningSoft, theme.colors.warning],
      gold: [theme.colors.infoSoft, theme.colors.primaryText],
    };
    const [bg, fg] = map[$tone];
    return css`background: ${bg}; color: ${fg};`;
  }}
`;

/* ---------- Form ---------- */
export const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const fieldCss = css`
  width: 100%;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text};
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primarySoft}; }
  &[aria-invalid='true'] { border-color: ${({ theme }) => theme.colors.danger}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`;
export const Input = styled.input`${fieldCss}`;
export const Textarea = styled.textarea`${fieldCss} min-height: 96px; resize: vertical;`;
export const Select = styled.select`${fieldCss}`;

export const FieldError = styled.span`
  color: ${({ theme }) => theme.colors.dangerText};
  font-size: 0.8rem;
  font-weight: 500;
`;

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

/**
 * Campo con etichetta collegata all'input (htmlFor/id) e suggerimento/errore annunciati
 * tramite aria-describedby, così il nome accessibile resta solo l'etichetta.
 */
export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactElement<Record<string, unknown>> }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id: (children.props.id as string | undefined) ?? id, 'aria-describedby': describedBy })
    : children;
  return (
    <FieldWrap>
      <Label as="label" htmlFor={(children.props.id as string | undefined) ?? id}>{label}</Label>
      {control}
      {hint && !error && <Muted id={`${id}-hint`} $size="0.78rem">{hint}</Muted>}
      {error && <FieldError id={`${id}-err`} role="alert">{error}</FieldError>}
    </FieldWrap>
  );
}

export const Checkbox = styled.label`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  input { margin-top: 3px; accent-color: ${({ theme }) => theme.colors.primary}; }
`;

/* ---------- Stati ---------- */
const spin = keyframes`to { transform: rotate(360deg); }`;
export const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.primary};
  animation: ${spin} 0.8s linear infinite;
  margin: 32px auto;
`;

const EmptyBox = styled.div`
  text-align: center;
  padding: 44px 20px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  svg { color: ${({ theme }) => theme.colors.textMuted}; }
  h3 { color: ${({ theme }) => theme.colors.textSecondary}; }
`;

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <EmptyBox>
      {icon}
      <h3>{title}</h3>
      {children && <div>{children}</div>}
    </EmptyBox>
  );
}

export const Alert = styled.div<{ $tone?: 'error' | 'success' | 'info' | 'warning' }>`
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.9rem;
  ${({ $tone = 'info', theme }) => {
    const map = {
      error: [theme.colors.dangerSoft, theme.colors.dangerText, theme.colors.dangerBorder],
      success: [theme.colors.successSoft, theme.colors.successText, theme.colors.successBorder],
      warning: [theme.colors.warningSoft, theme.colors.warning, theme.colors.warningBorder],
      info: [theme.colors.infoSoft, theme.colors.primaryText, theme.colors.infoBorder],
    } as const;
    const [bg, fg, bd] = map[$tone];
    return css`background: ${bg}; color: ${fg}; border: 1px solid ${bd};`;
  }}
`;

/* ---------- Layout pagina ---------- */
const HeaderWrap = styled.header`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 22px;
`;

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <HeaderWrap>
      <div>
        <h1>{title}</h1>
        {subtitle && <Muted style={{ marginTop: 6 }}>{subtitle}</Muted>}
      </div>
      {actions && <Stack $row $gap={8} $wrap>{actions}</Stack>}
    </HeaderWrap>
  );
}

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  th {
    text-align: left;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textMuted};
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  td {
    padding: 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
`;

export const TableScroll = styled.div`
  overflow-x: auto;
  ${media.mobile} { margin: 0 -8px; }
`;

export const Tabs = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 18px;
`;

/** Tab: fondo blu del marchio; la tab attiva è più scura, in grassetto e sottolineata. */
export const Tab = styled.button.attrs<{ $active?: boolean }>((p) => ({ type: 'button', 'aria-pressed': !!p.$active }))<{ $active?: boolean }>`
  border: 0;
  background: ${({ theme, $active }) => ($active ? theme.colors.brandDarker : theme.colors.brand)};
  color: ${({ theme }) => theme.colors.onBrand};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 7px 15px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: ${({ $active }) => ($active ? 'inset 0 -3px 0 rgba(255,255,255,0.85)' : 'none')};
  &:hover { background: ${({ theme }) => theme.colors.brandDark}; }
`;

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <Stack $row $gap={8} $align="center" $justify="center" style={{ marginTop: 20 }}>
      <Button $variant="secondary" $size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>{t('components.ui.precedente')}</Button>
      <Muted>{tx('components.ui.paginaPageDiTotalpages', { page, totalPages })}
      </Muted>
      <Button $variant="secondary" $size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>{t('components.ui.successiva')}</Button>
    </Stack>
  );
}

/* ---------- Guadagno / perdita ---------- */
const GainWrap = styled.span<{ $tone: 'up' | 'down' | 'even'; $size: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: ${({ $size }) => `${$size}px`};
  color: ${({ $tone, theme }) => ($tone === 'up' ? theme.colors.success : $tone === 'down' ? theme.colors.danger : theme.colors.textSecondary)};
`;

/** Guadagno in verde, perdita in rosso (in Bustercoin, con segno). */
export function Gain({ value, size = 15, pct }: { value: number | null; size?: number; pct?: number }) {
  if (value === null) return <Muted as="span" $size={`${size * 0.9}px`}>{t('components.ui.inAttesaDellIncasso')}</Muted>;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'even';
  return (
    <GainWrap $tone={tone} $size={size} data-trend={tone}>
      {tone === 'up' ? '▲' : tone === 'down' ? '▼' : '='} {formatBc(value, true)}
      {pct !== undefined && <span style={{ fontWeight: 600, opacity: 0.85 }}>({pct > 0 ? '+' : ''}{t('components.format.percentuale', { sign: '', value: pct.toLocaleString(LOCALE, { maximumFractionDigits: 1 }) })})</span>}
    </GainWrap>
  );
}
