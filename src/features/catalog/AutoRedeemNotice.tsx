import styled from 'styled-components';
import { CalendarClock } from 'lucide-react';
import { formatDateTime } from '../../components/format';

const Note = styled.p`
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 0.76rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textMuted};
  svg { flex-shrink: 0; margin-top: 1px; }
`;

/** Avviso sempre presente sotto ogni film: riscatto automatico all'uscita dalle sale. */
export function AutoRedeemNotice({ date, past }: { date: string | null; past?: boolean }) {
  return (
    <Note data-testid="auto-redeem-notice">
      <CalendarClock size={13} aria-hidden />
      <span>
        {past
          ? `Il film è uscito dalle sale il ${formatDateTime(date)}.`
          : date
            ? `Il film verrà riscattato automaticamente all’uscita dalle sale: ${formatDateTime(date)}.`
            : 'Il film verrà riscattato automaticamente quando uscirà dalle sale (data non ancora definita).'}
      </span>
    </Note>
  );
}
