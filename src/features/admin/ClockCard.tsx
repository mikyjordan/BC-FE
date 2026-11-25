import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import { Alert, Button, Card, Field, Muted, Stack } from '../../components/ui';
import { formatDateTime } from '../../components/format';
import { fromItalyInput, MAX_YEAR, MIN_YEAR } from '../../components/time';
import { DateTimeInput } from './DateTimeInput';
import { t } from '../../i18n';

interface ClockStatus {
  enabled: boolean;
  simulated: boolean;
  now: string;
  realNow: string;
}

const HOUR = 3_600_000;

/**
 * Orologio di simulazione (solo sviluppo, con SIMULATED_CLOCK sul database di simulazione):
 * il Superadmin sposta in avanti la data su cui si basa tutto il sistema. Non compare se il
 * backend non ha l'orologio simulato attivo.
 */
export function ClockCard() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ['admin', 'clock'], queryFn: () => api<ClockStatus>('/admin/clock'), refetchInterval: 30_000 });
  const [when, setWhen] = useState('');
  const [error, setError] = useState<string | null>(null);
  const set = useAdminMutation((at: string) => api<ClockStatus>('/admin/clock', { method: 'PUT', body: { at } }));
  const s = status.data;
  if (!s?.enabled) return null;

  const move = (at: string) => {
    setError(null);
    set.mutate(at, {
      onSuccess: () => {
        setWhen('');
        void qc.invalidateQueries();
      },
      onError: (err) => setError(err instanceof ApiError ? err.message : t('admin.clockCard.errore')),
    });
  };
  const plus = (ms: number) => move(new Date(Date.parse(s.now) + ms).toISOString());

  return (
    <Card data-testid="clock-card">
      <Stack $gap={12}>
        <Stack $row $gap={8} $align="center">
          <FlaskConical size={18} aria-hidden />
          <h3>{t('admin.clockCard.titolo')}</h3>
        </Stack>
        <Muted $size="0.85rem">{t('admin.clockCard.nota')}</Muted>
        <div data-testid="clock-now">
          <Muted $size="0.8rem">{s.simulated ? t('admin.clockCard.dataSimulata') : t('admin.clockCard.dataVera')}</Muted>
          <strong>{formatDateTime(s.now)}</strong>
        </div>
        <Stack $row $gap={8} $wrap>
          <Button $size="sm" $variant="secondary" disabled={set.isPending} onClick={() => plus(HOUR)}>{t('admin.clockCard.piuUnOra')}</Button>
          <Button $size="sm" $variant="secondary" disabled={set.isPending} onClick={() => plus(24 * HOUR)}>{t('admin.clockCard.piuUnGiorno')}</Button>
          <Button $size="sm" $variant="secondary" disabled={set.isPending} onClick={() => plus(7 * 24 * HOUR)}>{t('admin.clockCard.piuUnaSettimana')}</Button>
        </Stack>
        <Field label={t('admin.clockCard.vaiA')} hint={t('admin.clockCard.soloAvanti')}>
          <DateTimeInput value={when} onChange={setWhen} defaultTime="09:00" />
        </Field>
        <div>
          <Button disabled={!when || set.isPending} onClick={() => {
              const at = fromItalyInput(when);
              if (at) move(at);
              else setError(t('common.dataNonValida', { min: MIN_YEAR, max: MAX_YEAR }));
            }}>{t('admin.clockCard.imposta')}</Button>
        </div>
        {error && <Alert $tone="error">{error}</Alert>}
      </Stack>
    </Card>
  );
}
