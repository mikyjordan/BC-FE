import { useEffect } from 'react';
import styled from 'styled-components';
import { FlaskConical } from 'lucide-react';
import { useServerClock } from '../api/hooks';
import { syncServerClock } from './clock';
import { formatDateTime } from './format';
import { t } from '../i18n';

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.onStatus};
  background: repeating-linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.warning} 0 12px,
    ${({ theme }) => theme.colors.warningStripe} 12px 24px
  );
`;

/**
 * Solo con l'orologio simulato del backend (sviluppo): avviso fisso con la data simulata, e
 * allineamento dell'ora del sito a quella data.
 */
export function SimulatedClockBanner() {
  const clock = useServerClock();
  const data = clock.data;
  useEffect(() => {
    if (data) syncServerClock(data.now, data.simulated);
  }, [data]);
  if (!data?.simulated) return null;
  return (
    <Bar role="status" data-testid="simulated-clock">
      <FlaskConical size={15} aria-hidden /> {t('components.simulatedClock.avviso', { date: formatDateTime(data.now) })}
    </Bar>
  );
}
