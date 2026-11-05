import { useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAdminBoxOffice, useAdminMutation } from '../../api/hooks';
import type { AdminContent } from '../../api/types';
import { Alert, Bc, Button, Card, Field, Input, Muted, Stack, Table, TableScroll } from '../../components/ui';
import { formatBc, formatDateTime, formatNumber } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { fromLocalInput, toLocalInput } from './content-fields';

/**
 * Inserimento dell'incasso del film (1 € = 1 B). Ogni inserimento è una nuova rilevazione
 * immutabile: per correggere un errore si inserisce una nuova rilevazione.
 * L'incasso in vigore è quello con la data di rilevazione più recente ed è il valore che
 * gli utenti ricevono quando riscattano il film.
 */
export function BoxOfficeSection({ movie }: { movie: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const can = hasPermission(user, 'boxoffice.manage');
  const history = useAdminBoxOffice(movie.id);
  const [gross, setGross] = useState('');
  const [spectators, setSpectators] = useState('');
  // La data di rilevazione parte sempre da "adesso" ed è modificabile.
  const [when, setWhen] = useState(() => toLocalInput(new Date().toISOString()));
  // Se l'operatore non modifica la data si usa l'istante esatto dell'invio (il campo ha precisione al minuto).
  const [whenTouched, setWhenTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const mutation = useAdminMutation((body: Record<string, unknown>) => api<{ becomesCurrent: boolean }>(`/admin/movies/${movie.id}/box-office`, { method: 'POST', body }));

  const amount = Number(gross);
  const valid = gross !== '' && Number.isInteger(amount) && amount >= 0;
  const decreasing = valid && movie.latestGross != null && amount < movie.latestGross;

  const submit = () => {
    setSaved(null);
    mutation.mutate(
      {
        grossAmount: amount,
        ...(spectators ? { spectators: Number(spectators) } : {}),
        recordedAt: whenTouched && when ? fromLocalInput(when) : new Date().toISOString(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: (r) => {
          const res = r as { becomesCurrent: boolean };
          setSaved(res.becomesCurrent ? `Incasso aggiornato a ${formatBc(amount)}.` : 'Rilevazione salvata nello storico (data precedente all’incasso in vigore).');
          setGross('');
          setSpectators('');
          setWhen(toLocalInput(new Date().toISOString()));
          setWhenTouched(false);
          setNotes('');
          void history.refetch();
        },
      },
    );
  };

  return (
    <Card>
      <h3 style={{ marginBottom: 4 }}>Incasso del film</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 14 }}>
        Inserisci l’incasso totale attuale in euro: vale 1 € = 1 Bustercoin. È l’importo che ogni utente riceve quando riscatta il film.
      </Muted>
      <Stack $gap={12}>
        <Stack $row $justify="space-between" $align="center">
          <Muted>Incasso in vigore</Muted>
          {movie.latestGross != null ? <Bc value={movie.latestGross} size={16} /> : <Muted>Nessuno</Muted>}
        </Stack>
        {movie.latestGrossAt && <Muted $size="0.75rem">Rilevato il {formatDateTime(movie.latestGrossAt)}</Muted>}

        {can ? (
          <>
            <Field label="Nuovo incasso totale (€)">
              <Input type="number" min={0} step={1} value={gross} onChange={(e) => setGross(e.target.value)} />
            </Field>
            <Stack $row $gap={10} $wrap>
              <div style={{ flex: '1 1 160px' }}>
                <Field label="Spettatori (facoltativo)">
                  <Input type="number" min={0} value={spectators} onChange={(e) => setSpectators(e.target.value)} />
                </Field>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Field label="Data rilevazione" hint="Precompilata con la data e l’ora attuali">
                  <Input type="datetime-local" value={when} onChange={(e) => { setWhen(e.target.value); setWhenTouched(true); }} />
                </Field>
              </div>
            </Stack>
            <Field label="Fonte / note (facoltative)">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Es. Cinetel, settimana 44" />
            </Field>
            {decreasing && <Alert $tone="warning">Il nuovo incasso è inferiore a quello in vigore: gli utenti che riscattano riceveranno meno.</Alert>}
            {mutation.error && <Alert $tone="error">{mutation.error instanceof ApiError ? mutation.error.message : 'Errore'}</Alert>}
            {saved && <Alert $tone="success">{saved}</Alert>}
            <div>
              <Button $variant="gold" disabled={!valid || mutation.isPending} onClick={submit}>
                Registra incasso {valid ? formatBc(amount) : ''}
              </Button>
            </div>
          </>
        ) : (
          <Muted $size="0.85rem">Non hai il permesso di inserire gli incassi (boxoffice.manage).</Muted>
        )}

        {(history.data?.items.length ?? 0) > 0 && (
          <TableScroll>
            <Table>
              <thead><tr><th>Rilevazione</th><th style={{ textAlign: 'right' }}>Incasso</th><th style={{ textAlign: 'right' }}>Spettatori</th><th>Note</th></tr></thead>
              <tbody>
                {history.data!.items.map((r) => (
                  <tr key={r.id}>
                    <td><Muted $size="0.85rem">{formatDateTime(r.recordedAt)}</Muted></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{formatBc(r.grossAmount)}</td>
                    <td style={{ textAlign: 'right' }}><Muted $size="0.85rem">{r.spectators !== null ? formatNumber(r.spectators) : '—'}</Muted></td>
                    <td><Muted $size="0.8rem">{r.notes ?? ''}</Muted></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Stack>
    </Card>
  );
}
