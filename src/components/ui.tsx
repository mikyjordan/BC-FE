import styled, { css, keyframes } from 'styled-components';
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { CoinIcon } from './brand/CoinIcon';
import { formatBc } from './format';
import { media } from '../theme/theme';

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
        // Riservato alle azioni economiche (acquisti, gestione Bustercoin).
        return css`
          background: ${theme.gradients.gold};
          color: #1E1504;
          box-shadow: ${theme.shadow.gold};
          &:hover:not(:disabled) { filter: brightness(1.06); }
        `;
      case 'secondary':
        return css`
          background: ${theme.colors.surfaceAlt};
          border-color: ${theme.colors.border};
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
          border-color: rgba(229, 86, 107, 0.4);
          color: #FFB3BE;
          &:hover:not(:disabled) { background: rgba(229, 86, 107, 0.24); }
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
  font-size: ${({ $size }) => `${$size}px`};
  ${({ $tone, theme }) =>
    $tone === 'negative'
      ? css`color: ${theme.colors.textSecondary};`
      : css`
          background: ${theme.gradients.goldText};
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        `}
`;

/** Importo in Bustercoin: sempre in oro, con l'icona della moneta. */
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
      blue: [theme.colors.primarySoft, '#AFC0FF'],
      green: [theme.colors.successSoft, '#8BE3BC'],
      red: [theme.colors.dangerSoft, '#FFB3BE'],
      amber: [theme.colors.warningSoft, '#F7CB85'],
      gold: ['rgba(226,185,75,0.14)', theme.colors.goldLight],
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
  color: #FF9AA9;
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
      error: [theme.colors.dangerSoft, '#FFC2CB', 'rgba(229,86,107,0.35)'],
      success: [theme.colors.successSoft, '#A9EDCF', 'rgba(63,185,132,0.35)'],
      warning: [theme.colors.warningSoft, '#F9D59A', 'rgba(232,161,58,0.35)'],
      info: [theme.colors.primarySoft, '#C5D1FF', 'rgba(79,107,216,0.35)'],
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

export const Tab = styled.button<{ $active?: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.textSecondary)};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 6px 14px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  &:hover { border-color: ${({ theme }) => theme.colors.borderStrong}; }
`;

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <Stack $row $gap={8} $align="center" $justify="center" style={{ marginTop: 20 }}>
      <Button $variant="secondary" $size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Precedente
      </Button>
      <Muted>
        Pagina {page} di {totalPages}
      </Muted>
      <Button $variant="secondary" $size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Successiva
      </Button>
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
  if (value === null) return <Muted as="span" $size={`${size * 0.9}px`}>In attesa dell’incasso</Muted>;
  const tone = value > 0 ? 'up' : value < 0 ? 'down' : 'even';
  return (
    <GainWrap $tone={tone} $size={size} data-trend={tone}>
      {tone === 'up' ? '▲' : tone === 'down' ? '▼' : '='} {formatBc(value, true)}
      {pct !== undefined && <span style={{ fontWeight: 600, opacity: 0.85 }}>({pct > 0 ? '+' : ''}{pct.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%)</span>}
    </GainWrap>
  );
}
