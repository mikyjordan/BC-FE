import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarX2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Button, Card, Field, Input, Muted, Stack } from '../../components/ui';
import { formatBc, formatDateTime } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { fromLocalInput, toLocalInput } from './content-fields';

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
      <h3 style={{ marginBottom: 4 }}>Uscita dalle sale e riscatto automatico</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 14 }}>
        Alla data indicata il film viene riscattato automaticamente a tutti gli utenti che lo possiedono, accreditando l’incasso in vigore. Da quel momento non è più acquistabile.
      </Muted>
      <Stack $gap={12}>
        {summary.data && (
          <Muted $size="0.85rem">
            Partecipazioni aperte: <strong>{summary.data.open}</strong> · riscattate: {summary.data.redeemed}
            {summary.data.redeemedAuto ? ` (di cui ${summary.data.redeemedAuto} automaticamente)` : ''}
          </Muted>
        )}

        {done ? (
          <Alert $tone="success">
            Riscatto automatico eseguito il {formatDateTime(movie.autoRedeemedAt)} (uscita dalle sale: {formatDateTime(movie.autoRedeemAt)}). La data non è più modificabile.
          </Alert>
        ) : (
          <>
            {movie.autoRedeemAt ? (
              <Alert $tone="info">Uscita dalle sale impostata: {formatDateTime(movie.autoRedeemAt)}</Alert>
            ) : (
              <Muted $size="0.85rem">Nessuna data impostata.</Muted>
            )}
            {movie.autoRedeemAt && noGross && open > 0 && (
              <Alert $tone="warning">Manca l’incasso del film: alla scadenza il riscatto automatico attenderà finché non verrà inserito.</Alert>
            )}
            {can ? (
              <>
                <Field label="Data e ora di uscita dalle sale">
                  <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                </Field>
                {mutation.error && <Alert $tone="error">{mutation.error instanceof ApiError ? mutation.error.message : 'Errore'}</Alert>}
                <Stack $row $gap={8} $wrap>
                  <Button $variant="gold" disabled={!when || mutation.isPending} onClick={() => setConfirm('save')}>
                    <CalendarX2 size={15} /> {movie.autoRedeemAt ? 'Aggiorna data' : 'Imposta data'}
                  </Button>
                  {movie.autoRedeemAt && (
                    <Button $variant="secondary" disabled={mutation.isPending} onClick={() => setConfirm('clear')}>Rimuovi data</Button>
                  )}
                </Stack>
              </>
            ) : (
              <Muted $size="0.85rem">Non hai il permesso di impostare l’uscita dalle sale (content.purchases).</Muted>
            )}
          </>
        )}
      </Stack>

      {confirm && (
        <ConfirmModal
          title={confirm === 'save' ? 'Impostare l’uscita dalle sale?' : 'Rimuovere la data?'}
          message={
            confirm === 'save' ? (
              <Stack $gap={8}>
                <span>Il <strong>{formatDateTime(fromLocalInput(when))}</strong> il film verrà riscattato automaticamente a tutti i possessori ({open} partecipazioni aperte ora).</span>
                <span>Valore accreditato: l’incasso in vigore in quel momento{movie.latestGross ? ` (oggi ${formatBc(movie.latestGross)})` : ''}. Dopo quella data il film non sarà più acquistabile.</span>
              </Stack>
            ) : (
              'Il film non verrà più riscattato automaticamente finché non imposterai una nuova data.'
            )
          }
          confirmLabel={confirm === 'save' ? 'Conferma data' : 'Rimuovi'}
          pending={mutation.isPending}
          error={mutation.error?.message}
          onClose={() => setConfirm(null)}
          onConfirm={() => mutation.mutate(confirm === 'save' ? fromLocalInput(when) : null, { onSuccess: () => setConfirm(null) })}
        />
      )}
    </Card>
  );
}
