import { Link } from 'react-router';
import styled from 'styled-components';
import { Clock } from 'lucide-react';
import { formatDate, formatTime } from '../../components/format';
import { t } from '../../i18n';
import { appNowMs } from '../../components/clock';

const Note = styled.p`
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 0.76rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textMuted};
  svg { flex-shrink: 0; margin-top: 1px; }
  a { text-decoration: underline; color: ${({ theme }) => theme.colors.primary}; }
`;

/**
 * Sotto ogni film acquistabile: "Acquistabile fino alle 23:59 del 06 nov 2026." con il link a
 * "Come funziona". La data è la chiusura degli acquisti (23:59 del giorno prima dell'uscita
 * nelle sale, ora italiana). Non compare se gli acquisti sono già chiusi.
 */
export function PurchaseDeadlineNote({ closesAt, $size }: { closesAt: string | null | undefined; $size?: string }) {
  if (!closesAt || new Date(closesAt).getTime() <= appNowMs()) return null;
  return (
    <Note data-testid="purchase-deadline" style={$size ? { fontSize: $size } : undefined}>
      <Clock size={13} aria-hidden />
      <span>
        {t('catalog.purchaseDeadline.acquistabileFino', { time: formatTime(closesAt), date: formatDate(closesAt) })}{' '}
        <Link to="/come-funziona">{t('catalog.purchaseDeadline.comeFunziona')}</Link>
      </span>
    </Note>
  );
}
