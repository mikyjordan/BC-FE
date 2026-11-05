import { useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAdminBoxOffice, useAdminMutation } from '../../api/hooks';
import type { AdminContent } from '../../api/types';
import { Alert, Bc, Button, Card, Field, Input, Muted, Stack, Table, TableScroll } from '../../components/ui';
import { formatBc, formatDateTime } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { fromLocalInput, toLocalInput } from './content-fields';
import { BoxOfficeReadingRow } from './BoxOfficeReadingRow';

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

  const [errors, setErrors] = useState<{ grossAmount?: string; recordedAt?: string }>({});
  const amount = Number(gross);
  const valid = gross !== '' && Number.isInteger(amount) && amount >= 0;

  /** Incasso e data di rilevazione sono obbligatori (stesse regole del backend). */
  const validate = () => {
    const e: typeof errors = {};
    if (gross === '') e.grossAmount = 'L’incasso è obbligatorio';
    else if (!Number.isInteger(amount) || amount < 0) e.grossAmount = 'Inserisci un numero intero maggiore o uguale a zero';
    if (!when) e.recordedAt = 'La data di rilevazione è obbligatoria';
    else if (new Date(when).getTime() > Date.now() + 60_000) e.recordedAt = 'La data di rilevazione non può essere futura';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const decreasing = valid && movie.latestGross != null && amount < movie.latestGross;

  const submit = () => {
    setSaved(null);
    if (!validate()) return;
    mutation.mutate(
      {
        grossAmount: amount,
        ...(spectators ? { spectators: Number(spectators) } : {}),
        recordedAt: whenTouched ? fromLocalInput(when) : new Date().toISOString(),
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
        onError: (err) => {
          if (err instanceof ApiError && err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
        },
      },
    );
  };

  return (
    <Card>
      <h3 style={{ marginBottom: 4 }}>Incasso del film</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 14 }}>
        Inserisci l’incasso totale attuale in euro: vale 1 € = 1 Bustercoin. È l’importo che ogni utente riceve quando riscatta il film.
        Le rilevazioni si possono modificare o eliminare: i riscatti già effettuati non cambiano.
      </Muted>
      <Stack $gap={12}>
        <Stack $row $justify="space-between" $align="center">
          <Muted>Incasso in vigore</Muted>
          {movie.latestGross != null ? <Bc value={movie.latestGross} size={16} /> : <Muted>Nessuno</Muted>}
        </Stack>
        {movie.latestGrossAt && <Muted $size="0.75rem">Rilevato il {formatDateTime(movie.latestGrossAt)}</Muted>}

        {can ? (
          <>
            <Field label="Nuovo incasso totale (€) *" error={errors.grossAmount}>
              <Input type="number" min={0} step={1} required aria-invalid={!!errors.grossAmount} value={gross} onChange={(e) => setGross(e.target.value)} />
            </Field>
            <Stack $row $gap={10} $wrap>
              <div style={{ flex: '1 1 160px' }}>
                <Field label="Spettatori (facoltativo)">
                  <Input type="number" min={0} value={spectators} onChange={(e) => setSpectators(e.target.value)} />
                </Field>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <Field label="Data rilevazione *" hint="Precompilata con la data e l’ora attuali" error={errors.recordedAt}>
                  <Input type="datetime-local" required aria-invalid={!!errors.recordedAt} value={when} onChange={(e) => { setWhen(e.target.value); setWhenTouched(true); }} />
                </Field>
              </div>
            </Stack>
            <Field label="Fonte / note (facoltative)">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Es. Cinetel, settimana 44" />
            </Field>
            {decreasing && <Alert $tone="warning">Il nuovo incasso è inferiore a quello in vigore: gli utenti che riscattano riceveranno meno.</Alert>}
            {mutation.error && !Object.keys(errors).length && <Alert $tone="error">{mutation.error instanceof ApiError ? mutation.error.message : 'Errore'}</Alert>}
            {saved && <Alert $tone="success">{saved}</Alert>}
            <div>
              <Button $variant="gold" disabled={mutation.isPending} onClick={submit}>
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
              <thead><tr><th>Rilevazione</th><th style={{ textAlign: 'right' }}>Incasso</th><th style={{ textAlign: 'right' }}>Spettatori</th><th>Note</th><th /></tr></thead>
              <tbody>
                {history.data!.items.map((r) => (
                  <BoxOfficeReadingRow
                    key={r.id}
                    movieId={movie.id}
                    reading={r}
                    isCurrent={r.id === movie.latestGrossReadingId}
                    canManage={can}
                    onChanged={(msg) => {
                      setSaved(msg);
                      void history.refetch();
                    }}
                  />
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Stack>
    </Card>
  );
}
