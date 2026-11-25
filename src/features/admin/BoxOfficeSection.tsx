import { MAX_YEAR, MIN_YEAR } from '../../components/time';
import { useState } from 'react';
import { api, ApiError } from '../../api/client';
import { useAdminBoxOffice, useAdminMutation } from '../../api/hooks';
import type { AdminContent } from '../../api/types';
import { Alert, Bc, Button, Card, Field, Input, Muted, Stack, Table, TableScroll } from '../../components/ui';
import { formatBc, formatDateTime } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { fromLocalInput, toLocalInput } from './content-fields';
import { BoxOfficeReadingRow } from './BoxOfficeReadingRow';
import { t, tx } from '../../i18n';
import { appNow, appNowMs } from '../../components/clock';

/**
 * Incasso del film (1 € = 1 B). Ogni inserimento è una rilevazione, modificabile o eliminabile.
 * L'incasso in vigore è quello con la data di rilevazione più recente ed è il valore che
 * gli utenti ricevono quando riscattano il film. Si può inserire e modificare dal giorno di
 * uscita nelle sale finché tutti i possessori non hanno riscattato il film (regola del backend).
 */
export function BoxOfficeSection({ movie }: { movie: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const can = hasPermission(user, 'boxoffice.manage');
  const history = useAdminBoxOffice(movie.id);
  // L'incasso si modifica dal giorno di uscita in sala finché tutti i possessori non hanno riscattato.
  const win = history.data?.window;
  const editable = can && !!win?.editable;
  const [gross, setGross] = useState('');
  // La data di rilevazione parte sempre da "adesso" ed è modificabile.
  const [when, setWhen] = useState(() => toLocalInput(appNow().toISOString()));
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
    if (gross === '') e.grossAmount = t('admin.boxOfficeSection.lIncassoEObbligatorio');
    else if (!Number.isInteger(amount) || amount < 0) e.grossAmount = t('admin.boxOfficeSection.inserisciUnNumeroInteroMaggiore');
    if (!when) e.recordedAt = t('admin.boxOfficeSection.laDataDiRilevazioneE');
    else if (!fromLocalInput(when)) e.recordedAt = t('common.dataNonValida', { min: MIN_YEAR, max: MAX_YEAR });
    else if (new Date(fromLocalInput(when)!).getTime() > appNowMs() + 60_000) e.recordedAt = t('admin.boxOfficeSection.laDataDiRilevazioneNon');
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
        recordedAt: whenTouched ? fromLocalInput(when) : appNow().toISOString(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
      {
        onSuccess: (r) => {
          const res = r as { becomesCurrent: boolean };
          setSaved(res.becomesCurrent ? t('admin.boxOfficeSection.incassoAggiornatoAAmount', { amount: formatBc(amount) }) : t('admin.boxOfficeSection.rilevazioneSalvataNelloStoricoData'));
          setGross('');
          setWhen(toLocalInput(appNow().toISOString()));
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
      <h3 style={{ marginBottom: 4 }}>{t('admin.boxOfficeSection.incassoDelFilm')}</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 14 }}>{t('admin.boxOfficeSection.inserisciLIncassoTotaleAttuale')}</Muted>
      <Stack $gap={12}>
        <Stack $row $justify="space-between" $align="center">
          <Muted>{t('admin.boxOfficeSection.incassoInVigore')}</Muted>
          {movie.latestGross != null ? <Bc value={movie.latestGross} size={16} /> : <Muted>{t('admin.boxOfficeSection.nessuno')}</Muted>}
        </Stack>
        {movie.latestGrossAt && <Muted $size="0.75rem">{tx('admin.boxOfficeSection.rilevatoIlLatestgrossat', { latestGrossAt: formatDateTime(movie.latestGrossAt) })}</Muted>}

        {win && !win.editable && (
          <Alert $tone={win.code === 'BOX_OFFICE_CLOSED' ? 'success' : 'warning'} data-testid="box-office-window">{win.message}</Alert>
        )}
        {win?.editable && win.opensOn && (
          <Muted $size="0.8rem">{t('admin.boxOfficeSection.periodoAperto', { open: win.holdings.open, total: win.holdings.total })}</Muted>
        )}

        {!can ? (
          <Muted $size="0.85rem">{t('admin.boxOfficeSection.nonHaiIlPermessoDi')}</Muted>
        ) : editable ? (
          <>
            <Field label={t('admin.boxOfficeSection.nuovoIncassoTotale')} error={errors.grossAmount}>
              <Input type="number" min={0} step={1} required aria-invalid={!!errors.grossAmount} value={gross} onChange={(e) => setGross(e.target.value)} />
            </Field>
            <Stack $row $gap={10} $wrap>
              <div style={{ flex: '1 1 200px' }}>
                <Field label={t('admin.boxOfficeSection.dataRilevazione')} hint={t('admin.boxOfficeSection.precompilataConLaDataE')} error={errors.recordedAt}>
                  <Input type="datetime-local" required aria-invalid={!!errors.recordedAt} value={when} onChange={(e) => { setWhen(e.target.value); setWhenTouched(true); }} />
                </Field>
              </div>
            </Stack>
            <Field label={t('admin.boxOfficeSection.fonteNoteFacoltative')}>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('admin.boxOfficeSection.esCinetelSettimana44')} />
            </Field>
            {decreasing && <Alert $tone="warning">{t('admin.boxOfficeSection.ilNuovoIncassoEInferiore')}</Alert>}
            {mutation.error && !Object.keys(errors).length && <Alert $tone="error">{mutation.error instanceof ApiError ? mutation.error.message : t('admin.boxOfficeSection.errore')}</Alert>}
            {saved && <Alert $tone="success">{saved}</Alert>}
            <div>
              <Button $variant="gold" disabled={mutation.isPending} onClick={submit}>{tx('admin.boxOfficeSection.registraIncassoV', { v: valid ? formatBc(amount) : '' })}
              </Button>
            </div>
          </>
        ) : null}

        {(history.data?.items.length ?? 0) > 0 && (
          <TableScroll>
            <Table>
              <thead><tr><th>{t('admin.boxOfficeSection.rilevazione')}</th><th style={{ textAlign: 'right' }}>{t('admin.boxOfficeSection.incasso')}</th><th>{t('admin.boxOfficeSection.note')}</th><th /></tr></thead>
              <tbody>
                {history.data!.items.map((r) => (
                  <BoxOfficeReadingRow
                    key={r.id}
                    movieId={movie.id}
                    reading={r}
                    isCurrent={r.id === movie.latestGrossReadingId}
                    canManage={editable}
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
