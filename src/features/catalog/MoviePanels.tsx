import { useState } from 'react';
import { Link } from 'react-router';
import { BarChart3, ShoppingBag } from 'lucide-react';
import { ApiError } from '../../api/client';
import { newIdempotencyKey, useHoldings, useMovieBoxOffice, usePurchase, useWallet } from '../../api/hooks';
import type { PublicMovie } from '../../api/types';
import { Alert, Bc, Button, Card, Muted, Stack, Table } from '../../components/ui';
import { formatBc, formatDate, formatDateTime } from '../../components/format';
import { useAuthStore } from '../../store/auth';
import { SuperadminNoPurchase } from '../../components/SuperadminNoPurchase';
import { MovieHoldingCard } from '../wallet/MovieHoldingCard';
import { PurchaseBadge } from '../../components/PurchaseBadge';
import { AutoRedeemNotice } from './AutoRedeemNotice';
import { PurchaseDeadlineNote } from './PurchaseDeadlineNote';
import { t, tx } from '../../i18n';

/** Incasso attuale e storico delle rilevazioni inserite dal Superadmin (mai valori inventati). */
export function BoxOfficeCard({ movie }: { movie: PublicMovie }) {
  const history = useMovieBoxOffice(movie.id);
  const items = history.data?.items ?? [];
  return (
    <Card>
      <Stack $row $gap={10} $align="center" style={{ marginBottom: 10 }}>
        <BarChart3 size={18} />
        <h3>{t('catalog.moviePanels.boxOfficeItaliano')}</h3>
      </Stack>
      {movie.boxOffice.currentGross === null ? (
        <Muted>{t('catalog.moviePanels.nessunaRilevazioneDIncassoDisponibile')}</Muted>
      ) : (
        <Stack $gap={12}>
          <div>
            <Muted $size="0.8rem">{t('catalog.moviePanels.incassoAttuale')}</Muted>
            <Bc value={movie.boxOffice.currentGross} size={22} />
            <Muted $size="0.75rem">{tx('catalog.moviePanels.aggiornatoAlRecordedat11', { recordedAt: formatDateTime(movie.boxOffice.recordedAt) })}</Muted>
          </div>
          {items.length > 1 && (
            <Table>
              <thead>
                <tr><th>{t('catalog.moviePanels.rilevazione')}</th><th style={{ textAlign: 'right' }}>{t('catalog.moviePanels.incasso')}</th></tr>
              </thead>
              <tbody>
                {items.slice(0, 8).map((r, i) => (
                  <tr key={`${r.recordedAt}-${i}`}>
                    <td><Muted $size="0.85rem">{formatDate(r.recordedAt)}</Muted></td>
                    <td style={{ textAlign: 'right' }}>{formatBc(r.grossAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Stack>
      )}
    </Card>
  );
}

/**
 * Pannello laterale del film. Se l'utente possiede il film mostra prezzo d'acquisto,
 * incasso, guadagno/perdita e "Riscatta"; altrimenti l'acquisto unico a prezzo fisso.
 */
export function MovieSidePanel({ movie }: { movie: PublicMovie }) {
  const status = useAuthStore((s) => s.status);
  const isSuperadmin = useAuthStore((s) => s.user?.role === 'SUPERADMIN');
  const holdings = useHoldings();
  const wallet = useWallet();
  const purchase = usePurchase('movies', movie.id);
  const [confirming, setConfirming] = useState(false);
  const [idemKey, setIdemKey] = useState(newIdempotencyKey);
  const owned = holdings.data?.items.find((h) => h.contentType === 'MOVIE' && h.contentId === movie.id);
  const price = movie.purchase.priceBc ?? 0;
  const balance = wallet.data?.balance ?? 0;

  if (owned) {
    return (
      <Stack $gap={10}>
        <h3>{owned.status === 'REDEEMED' ? t('catalog.moviePanels.filmRiscattato') : t('catalog.moviePanels.ilTuoInvestimento')}</h3>
        <MovieHoldingCard h={owned} compact />
        {owned.status === 'REDEEMED' && <Muted $size="0.8rem">{t('catalog.moviePanels.unFilmRiscattatoNonPuo')}</Muted>}
      </Stack>
    );
  }

  if (!movie.purchase.purchasable) {
    return (
      <Card>
        <Stack $gap={8}>
          <h3>{t('catalog.moviePanels.acquisto')}</h3>
          <PurchaseBadge active={false} reason={movie.purchase.message ?? t('catalog.moviePanels.alMomentoNonEPossibile')} />
          {movie.purchase.priceBc ? <Bc value={movie.purchase.priceBc} size={20} /> : null}
          <AutoRedeemNotice date={movie.autoRedeemAt} past={movie.outOfTheaters} />
        </Stack>
      </Card>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Card>
        <Stack $gap={10}>
          <h3>{t('catalog.moviePanels.acquisto')}</h3>
          <PurchaseBadge active />
          <Bc value={price} size={22} />
          <Link to="/login"><Button $block>{t('catalog.moviePanels.accediPerAcquistare')}</Button></Link>
          <AutoRedeemNotice date={movie.autoRedeemAt} />
        </Stack>
      </Card>
    );
  }

  if (isSuperadmin) return <SuperadminNoPurchase priceBc={movie.purchase.priceBc} />;

  const insufficient = price > balance;
  const err = purchase.error instanceof ApiError ? purchase.error.message : purchase.error ? t('catalog.moviePanels.acquistoNonRiuscito') : null;

  return (
    <Card>
      <Stack $gap={14}>
        <h3>{t('catalog.moviePanels.investiInQuestoFilm')}</h3>
        <PurchaseBadge active />
        <div>
          <Muted $size="0.8rem">{t('catalog.moviePanels.prezzo')}</Muted>
          <Bc value={price} size={24} />
        </div>
        <Muted $size="0.82rem">{t('catalog.moviePanels.paghiIlPrezzoUnaSola')}</Muted>
        <PurchaseDeadlineNote closesAt={movie.purchase.closesAt} $size="0.85rem" />
        <Stack $row $justify="space-between">
          <Muted $size="0.8rem">{t('catalog.moviePanels.saldoDisponibile')}</Muted>
          <Muted $size="0.8rem">{formatBc(balance)}</Muted>
        </Stack>
        {insufficient && <Alert $tone="warning">{t('catalog.moviePanels.saldoBustercoinInsufficiente')}</Alert>}
        {err && <Alert $tone="error">{err}</Alert>}
        {!confirming ? (
          <Button $variant="gold" $block disabled={insufficient || purchase.isPending} onClick={() => setConfirming(true)}>
            <ShoppingBag size={17} />{' '}{t('catalog.moviePanels.acquista')}</Button>
        ) : (
          <Stack $row $gap={8}>
            <Button $variant="secondary" $block onClick={() => setConfirming(false)} disabled={purchase.isPending}>{t('catalog.moviePanels.annulla')}</Button>
            <Button
              $variant="gold"
              $block
              disabled={purchase.isPending}
              onClick={() =>
                purchase.mutate(
                  { quantity: 1, idempotencyKey: idemKey },
                  {
                    onSuccess: () => setConfirming(false),
                    onError: () => { setConfirming(false); setIdemKey(newIdempotencyKey()); },
                  },
                )
              }
            >
              {purchase.isPending ? t('catalog.moviePanels.acquisto2') : t('catalog.moviePanels.confermaPrice', { price: formatBc(price) })}
            </Button>
          </Stack>
        )}
        <AutoRedeemNotice date={movie.autoRedeemAt} />
        <Muted $size="0.75rem">{t('catalog.moviePanels.partecipazioneVirtualeDiGiocoNon')}</Muted>
      </Stack>
    </Card>
  );
}
