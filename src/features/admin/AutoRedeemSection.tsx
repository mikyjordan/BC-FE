import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarX2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Button, Card, Field, Muted, Stack } from '../../components/ui';
import { formatBc, formatDateTime } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { fromLocalInput, toLocalInput } from './content-fields';
import { DateTimeInput } from './DateTimeInput';
import { t, tx } from '../../i18n';

/**
 * Data di uscita dalle sale: a quella data il film viene riscattato automaticamente
 * a tutti gli utenti che lo possiedono, al valore dell'incasso in vigore.
 */
export function AutoRedeemSection({ movie }: { movie: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const can = hasPermission(user, 'content.purchases');
  const [when, setWhen] = useState(toLocalInput(movie.autoRedeemAt));
  const [confirm, setConfirm] = useState<'save' | 'clear' | null>(null);
  const summary = useQuery({
    queryKey: ['admin', 'movies', movie.id, 'holdings-summary'],
    queryFn: () => api<{ open: number; redeemed: number; redeemedAuto: number }>(`/admin/movies/${movie.id}/holdings-summary`),
  });
  const mutation = useAdminMutation((autoRedeemAt: string | null) => api(`/admin/movies/${movie.id}/auto-redeem`, { method: 'PATCH', body: { autoRedeemAt } }));
  useEffect(() => setWhen(toLocalInput(movie.autoRedeemAt)), [movie.autoRedeemAt]);

  const done = !!movie.autoRedeemedAt;
  const noGross = !movie.latestGross;
  const open = summary.data?.open ?? 0;

  return (
    <Card>
      <h3 style={{ marginBottom: 4 }}>{t('admin.autoRedeemSection.uscitaDalleSaleERiscatto')}</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 14 }}>{t('admin.autoRedeemSection.allaDataIndicataIlFilm')}</Muted>
      <Stack $gap={12}>
        {summary.data && (
          <Muted $size="0.85rem">{tx('admin.autoRedeemSection.partecipazioniAperteStrongRiscattateRedeemed', { strong: <strong>{summary.data.open}</strong>, redeemed: summary.data.redeemed, v: summary.data.redeemedAuto ? t('admin.autoRedeemSection.diCuiRedeemedautoAutomaticamente', { redeemedAuto: summary.data.redeemedAuto }) : '' })}
          </Muted>
        )}

        {done ? (
          <Alert $tone="success">{tx('admin.autoRedeemSection.riscattoAutomaticoEseguitoIlAutoredeemedat', { autoRedeemedAt: formatDateTime(movie.autoRedeemedAt), autoRedeemAt: formatDateTime(movie.autoRedeemAt) })}</Alert>
        ) : (
          <>
            {movie.autoRedeemAt ? (
              <Alert $tone="info">{tx('admin.autoRedeemSection.uscitaDalleSaleImpostataAutoredeemat', { autoRedeemAt: formatDateTime(movie.autoRedeemAt) })}</Alert>
            ) : (
              <Muted $size="0.85rem">{t('admin.autoRedeemSection.nessunaDataImpostata')}</Muted>
            )}
            {movie.autoRedeemAt && noGross && open > 0 && (
              <Alert $tone="warning">{t('admin.autoRedeemSection.mancaLIncassoDelFilm')}</Alert>
            )}
            {can ? (
              <>
                <Field label={t('admin.autoRedeemSection.dataEOraDiUscita')} hint={t('admin.autoRedeemSection.oraPredefinita')}>
                  <DateTimeInput value={when} onChange={setWhen} />
                </Field>
                {mutation.error && <Alert $tone="error">{mutation.error instanceof ApiError ? mutation.error.message : t('admin.autoRedeemSection.errore')}</Alert>}
                <Stack $row $gap={8} $wrap>
                  <Button $variant="gold" disabled={!when || mutation.isPending} onClick={() => setConfirm('save')}>
                    <CalendarX2 size={15} /> {movie.autoRedeemAt ? t('admin.autoRedeemSection.aggiornaData') : t('admin.autoRedeemSection.impostaData')}
                  </Button>
                  {movie.autoRedeemAt && (
                    <Button $variant="secondary" disabled={mutation.isPending} onClick={() => setConfirm('clear')}>{t('admin.autoRedeemSection.rimuoviData')}</Button>
                  )}
                </Stack>
              </>
            ) : (
              <Muted $size="0.85rem">{t('admin.autoRedeemSection.nonHaiIlPermessoDi')}</Muted>
            )}
          </>
        )}
      </Stack>

      {confirm && (
        <ConfirmModal
          title={confirm === 'save' ? t('admin.autoRedeemSection.impostareLUscitaDalleSale') : t('admin.autoRedeemSection.rimuovereLaData')}
          message={
            confirm === 'save' ? (
              <Stack $gap={8}>
                <span>{tx('admin.autoRedeemSection.ilStrongIlFilmVerra', { strong: <strong>{formatDateTime(fromLocalInput(when))}</strong>, open })}</span>
                <span>{tx('admin.autoRedeemSection.valoreAccreditatoLIncassoIn', { v: movie.latestGross ? t('admin.autoRedeemSection.oggi', { amount: formatBc(movie.latestGross) }) : '' })}</span>
              </Stack>
            ) : (
              t('admin.autoRedeemSection.ilFilmNonVerraPiu')
            )
          }
          confirmLabel={confirm === 'save' ? t('admin.autoRedeemSection.confermaData') : t('admin.autoRedeemSection.rimuovi')}
          pending={mutation.isPending}
          error={mutation.error?.message}
          onClose={() => setConfirm(null)}
          onConfirm={() => mutation.mutate(confirm === 'save' ? fromLocalInput(when) : null, { onSuccess: () => setConfirm(null) })}
        />
      )}
    </Card>
  );
}
