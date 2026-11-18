import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from 'styled-components';
import { Scale } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Bc, Button, Card, Checkbox, Field, Input, Muted, Stack } from '../../components/ui';
import { formatBc, formatDate, formatDateTime } from '../../components/format';
import { adminPurchaseState, PurchaseBadge } from '../../components/PurchaseBadge';
import { fromItalyInput, toItalyInput } from '../../components/time';
import { hasPermission, useAuthStore } from '../../store/auth';
import { theme } from '../../theme/theme';
import { DateTimeInput, dayBeforeReleaseAt2359 } from './DateTimeInput';
import { t, tx } from '../../i18n';
import { appNowMs } from '../../components/clock';

const Group = styled.div`
  display: grid;
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid ${theme.colors.border};
  h4 { font-size: 0.92rem; }
`;

type RuleField = 'italianReleaseDate' | 'priceBc' | 'autoRedeemAt';

interface RulesForm {
  release: string;
  price: string;
  autoRedeem: string;
  showOnHomepage: boolean;
  showInLeaderboards: boolean;
}

const fromMovie = (m: AdminContent): RulesForm => ({
  release: m.italianReleaseDate ?? '',
  price: m.priceBc ? String(m.priceBc) : '',
  autoRedeem: toItalyInput(m.autoRedeemAt),
  showOnHomepage: m.showOnHomepage,
  showInLeaderboards: m.showInLeaderboards,
});

/**
 * Regole del film: visibilità, uscita nelle sale, uscita dalle sale con riscatto automatico,
 * e prezzo, salvate insieme. Non c'è un interruttore degli acquisti: il film è acquistabile o no
 * solo in base a queste regole e alla pubblicazione. La chiusura degli acquisti non si sceglie: è
 * calcolata (23:59 del giorno prima dell'uscita nelle sale) e mostrata in sola lettura.
 */
export function MovieRulesSection({ movie }: { movie: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const can = hasPermission(user, 'content.purchases');
  const canVisibility = can && hasPermission(user, 'content.publish');
  const [form, setForm] = useState<RulesForm>(() => fromMovie(movie));
  const [errors, setErrors] = useState<Partial<Record<RuleField, string>>>({});
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof RulesForm>(key: K, value: RulesForm[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };
  // Riallinea il modulo quando il film viene ricaricato dal server.
  useEffect(
    () => setForm(fromMovie(movie)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movie.italianReleaseDate, movie.priceBc, movie.autoRedeemAt, movie.showOnHomepage, movie.showInLeaderboards],
  );

  const summary = useQuery({
    queryKey: ['admin', 'movies', movie.id, 'holdings-summary'],
    queryFn: () => api<{ open: number; redeemed: number; redeemedAuto: number }>(`/admin/movies/${movie.id}/holdings-summary`),
  });
  const mutation = useAdminMutation((body: Record<string, unknown>) => api<AdminContent>(`/admin/movies/${movie.id}/rules`, { method: 'PUT', body }));

  const opens = movie.purchaseOpensAt ?? movie.createdAt;
  const closes = fromItalyInput(dayBeforeReleaseAt2359(form.release));
  const redeemDone = !!movie.autoRedeemedAt;
  const autoRedeemChanged = (fromItalyInput(form.autoRedeem) ?? null) !== (movie.autoRedeemAt ? new Date(movie.autoRedeemAt).toISOString() : null);
  const legacyAvailableFrom = movie.availableFrom && new Date(movie.availableFrom).getTime() > appNowMs() ? movie.availableFrom : null;
  const open = summary.data?.open ?? 0;

  /** Stesse regole del backend, per segnalare subito i campi da correggere. */
  const validate = () => {
    const e: Partial<Record<RuleField, string>> = {};
    const n = Number(form.price);
    if (!form.release) e.italianReleaseDate = t('admin.movieRules.uscitaObbligatoria');
    else if (form.release !== movie.italianReleaseDate && closes && new Date(closes) <= new Date(opens)) e.italianReleaseDate = t('admin.movieRules.uscitaDopoCreazione');
    if (!form.price) e.priceBc = t('admin.movieRules.prezzoObbligatorio');
    else if (!Number.isInteger(n) || n <= 0) e.priceBc = t('admin.movieRules.prezzoIntero');
    if (form.autoRedeem && autoRedeemChanged) {
      if (new Date(fromItalyInput(form.autoRedeem)!).getTime() < appNowMs()) e.autoRedeemAt = t('admin.movieRules.riscattoNelPassato');
      else if (form.release && form.autoRedeem.slice(0, 10) < form.release) e.autoRedeemAt = t('admin.movieRules.riscattoPrimaDellUscita');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = (extra: Record<string, unknown> = {}) => {
    setConfirm(false);
    mutation.mutate(
      {
        italianReleaseDate: form.release,
        priceBc: Number.parseInt(form.price, 10),
        autoRedeemAt: fromItalyInput(form.autoRedeem),
        showOnHomepage: form.showOnHomepage,
        showInLeaderboards: form.showInLeaderboards,
        ...extra,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (err) => {
          if (err instanceof ApiError && err.details) {
            setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])) as Partial<Record<RuleField, string>>);
          }
        },
      },
    );
  };

  const submit = () => {
    setSaved(false);
    if (!validate()) return;
    // Impostare l'uscita dalle sale ha conseguenze per tutti i possessori: si conferma.
    if (form.autoRedeem && autoRedeemChanged) setConfirm(true);
    else save();
  };

  const toggle = (key: 'showOnHomepage' | 'showInLeaderboards', label: string, disabled: boolean) => (
    <Checkbox>
      <input type="checkbox" checked={form[key]} disabled={disabled} onChange={(e) => set(key, e.target.checked)} />
      {label}
    </Checkbox>
  );

  return (
    <Card data-testid="movie-rules">
      <h3 style={{ marginBottom: 4 }}>{t('admin.movieRules.titolo')}</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 14 }}>{t('admin.movieRules.nota')}</Muted>
      <Stack $gap={14}>
        <Stack $row $justify="space-between" $align="center">
          <PurchaseBadge {...adminPurchaseState(movie)} />
          {movie.priceBc ? <Bc value={movie.priceBc} size={14} /> : null}
        </Stack>

        <Group>
          <h4>{t('admin.movieRules.visibilita')}</h4>
          <Muted $size="0.8rem">{t('admin.movieRules.visibilitaNota')}</Muted>
          {toggle('showOnHomepage', t('admin.movieRules.mostraNellaHomepage'), !canVisibility)}
          {toggle('showInLeaderboards', t('admin.movieRules.includiNelleClassifiche'), !canVisibility)}
          {can && !canVisibility && <Muted $size="0.8rem">{t('admin.movieRules.visibilitaPermesso')}</Muted>}
          {legacyAvailableFrom && (
            <Alert $tone="warning" data-testid="legacy-available-from">
              <Stack $gap={8}>
                <span>{t('admin.movieRules.disponibileDalPrecedente', { date: formatDateTime(legacyAvailableFrom) })}</span>
                {canVisibility && (
                  <div>
                    <Button $size="sm" $variant="secondary" disabled={mutation.isPending} onClick={() => validate() && save({ availableFrom: null })}>
                      {t('admin.movieRules.rimuoviDisponibileDal')}
                    </Button>
                  </div>
                )}
              </Stack>
            </Alert>
          )}
        </Group>

        <Group>
          <h4>{t('admin.movieRules.dateEAcquisti')}</h4>
          <Field label={t('admin.movieRules.uscitaNelleSale')} error={errors.italianReleaseDate} hint={t('admin.movieRules.uscitaNelleSaleNota')}>
            <Input type="date" required aria-invalid={!!errors.italianReleaseDate} value={form.release} disabled={!can} onChange={(e) => set('release', e.target.value)} />
          </Field>
          <Muted $size="0.85rem" data-testid="auto-opens">{t('admin.movieRules.aperturaAutomatica', { date: formatDateTime(opens) })}</Muted>
          <div data-testid="auto-closes">
            <Muted $size="0.85rem">
              {closes
                ? tx('admin.movieRules.chiusuraAutomatica', { strong: <strong>{formatDateTime(closes)}</strong> })
                : t('admin.movieRules.chiusuraSenzaUscita')}
            </Muted>
          </div>
          <Field label={t('admin.movieRules.prezzo')} error={errors.priceBc}>
            <Input type="number" min={1} required aria-invalid={!!errors.priceBc} value={form.price} disabled={!can} onChange={(e) => set('price', e.target.value)} />
          </Field>
        </Group>

        <Group>
          <h4>{t('admin.movieRules.uscitaDalleSale')}</h4>
          <Muted $size="0.8rem">{t('admin.movieRules.uscitaDalleSaleNota')}</Muted>
          {summary.data && (
            <Muted $size="0.85rem">
              {tx('admin.movieRules.partecipazioni', {
                strong: <strong>{summary.data.open}</strong>,
                redeemed: summary.data.redeemed,
                v: summary.data.redeemedAuto ? t('admin.movieRules.diCuiAutomaticamente', { redeemedAuto: summary.data.redeemedAuto }) : '',
              })}
            </Muted>
          )}
          {redeemDone ? (
            <Alert $tone="success">{t('admin.movieRules.riscattoEseguito', { autoRedeemedAt: formatDateTime(movie.autoRedeemedAt), autoRedeemAt: formatDateTime(movie.autoRedeemAt) })}</Alert>
          ) : (
            <>
              <Field label={t('admin.movieRules.dataEOraUscitaDalleSale')} error={errors.autoRedeemAt} hint={t('admin.movieRules.facoltativa')}>
                <DateTimeInput value={form.autoRedeem} invalid={!!errors.autoRedeemAt} disabled={!can} onChange={(v) => set('autoRedeem', v)} />
              </Field>
              {form.autoRedeem && can && (
                <div>
                  <Button $size="sm" $variant="ghost" onClick={() => set('autoRedeem', '')}>{t('admin.movieRules.togliData')}</Button>
                </div>
              )}
              {movie.autoRedeemAt && !movie.latestGross && open > 0 && <Alert $tone="warning">{t('admin.movieRules.mancaIncasso')}</Alert>}
            </>
          )}
        </Group>

        {mutation.error && !Object.keys(errors).length && (
          <Alert $tone="error">{mutation.error instanceof ApiError ? mutation.error.message : t('admin.movieRules.errore')}</Alert>
        )}
        {saved && <Alert $tone="success">{t('admin.movieRules.salvate')}</Alert>}
        {can ? (
          <div>
            <Button $variant="gold" disabled={mutation.isPending} onClick={submit}>
              <Scale size={15} /> {t('admin.movieRules.salva')}
            </Button>
          </div>
        ) : (
          <Muted $size="0.85rem">{t('admin.movieRules.nonHaiIlPermesso')}</Muted>
        )}
      </Stack>

      {confirm && (
        <ConfirmModal
          title={t('admin.movieRules.confermaTitolo')}
          message={
            <Stack $gap={8}>
              <span>{tx('admin.movieRules.confermaMessaggio', { strong: <strong>{formatDateTime(fromItalyInput(form.autoRedeem))}</strong>, open })}</span>
              <span>{tx('admin.movieRules.confermaValore', { v: movie.latestGross ? t('admin.movieRules.oggi', { amount: formatBc(movie.latestGross) }) : '' })}</span>
              {form.release && <span>{t('admin.movieRules.confermaUscita', { date: formatDate(form.release) })}</span>}
            </Stack>
          }
          confirmLabel={t('admin.movieRules.confermaESalva')}
          pending={mutation.isPending}
          error={mutation.error?.message}
          onClose={() => setConfirm(false)}
          onConfirm={() => save()}
        />
      )}
    </Card>
  );
}
