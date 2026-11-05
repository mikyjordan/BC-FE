import { useState } from 'react';
import { Link } from 'react-router';
import { BarChart3, ShoppingBag } from 'lucide-react';
import { ApiError } from '../../api/client';
import { newIdempotencyKey, useHoldings, useMovieBoxOffice, usePurchase, useWallet } from '../../api/hooks';
import type { PublicMovie } from '../../api/types';
import { Alert, Bc, Button, Card, Muted, Stack, Table } from '../../components/ui';
import { formatBc, formatDate, formatDateTime, formatNumber } from '../../components/format';
import { useAuthStore } from '../../store/auth';
import { MovieHoldingCard } from '../wallet/MovieHoldingCard';
import { AutoRedeemNotice } from './AutoRedeemNotice';

/** Incasso attuale e storico delle rilevazioni inserite dal Superadmin (mai valori inventati). */
export function BoxOfficeCard({ movie }: { movie: PublicMovie }) {
  const history = useMovieBoxOffice(movie.id);
  const items = history.data?.items ?? [];
  return (
    <Card>
      <Stack $row $gap={10} $align="center" style={{ marginBottom: 10 }}>
        <BarChart3 size={18} />
        <h3>Box Office italiano</h3>
      </Stack>
      {movie.boxOffice.currentGross === null ? (
        <Muted>Nessuna rilevazione d’incasso disponibile per questo film.</Muted>
      ) : (
        <Stack $gap={12}>
          <div>
            <Muted $size="0.8rem">Incasso attuale</Muted>
            <Bc value={movie.boxOffice.currentGross} size={22} />
            <Muted $size="0.75rem">Aggiornato al {formatDateTime(movie.boxOffice.recordedAt)} · 1 € = 1 B</Muted>
          </div>
          {items.length > 1 && (
            <Table>
              <thead>
                <tr><th>Rilevazione</th><th style={{ textAlign: 'right' }}>Incasso</th><th style={{ textAlign: 'right' }}>Spettatori</th></tr>
              </thead>
              <tbody>
                {items.slice(0, 8).map((r, i) => (
                  <tr key={`${r.recordedAt}-${i}`}>
                    <td><Muted $size="0.85rem">{formatDate(r.recordedAt)}</Muted></td>
                    <td style={{ textAlign: 'right' }}>{formatBc(r.grossAmount)}</td>
                    <td style={{ textAlign: 'right' }}><Muted $size="0.85rem">{r.spectators !== null ? formatNumber(r.spectators) : '—'}</Muted></td>
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

/** La possibilità d'acquisto termina alla mezzanotte del giorno prima dell'uscita nelle sale. */
function PurchaseDeadline({ closesAt }: { closesAt: string | null }) {
  const lastDay = closesAt ? new Date(new Date(closesAt).getTime() - 1) : null;
  return (
    <Alert $tone="info" data-testid="purchase-deadline">
      Acquistabile fino alla mezzanotte del giorno prima dell’uscita nelle sale
      {lastDay ? `: ultimo giorno ${formatDate(lastDay.toISOString())}, chiusura ${formatDateTime(closesAt)}.` : '.'}{' '}
      <Link to="/come-funziona" style={{ textDecoration: 'underline' }}>Come funziona</Link>
    </Alert>
  );
}

/**
 * Pannello laterale del film. Se l'utente possiede il film mostra prezzo d'acquisto,
 * incasso, guadagno/perdita e "Riscatta"; altrimenti l'acquisto unico a prezzo fisso.
 */
export function MovieSidePanel({ movie }: { movie: PublicMovie }) {
  const status = useAuthStore((s) => s.status);
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
        <h3>{owned.status === 'REDEEMED' ? 'Film riscattato' : 'Il tuo investimento'}</h3>
        <MovieHoldingCard h={owned} compact />
        {owned.status === 'REDEEMED' && <Muted $size="0.8rem">Un film riscattato non può essere riacquistato.</Muted>}
      </Stack>
    );
  }

  if (!movie.purchase.purchasable) {
    return (
      <Card>
        <Stack $gap={8}>
          <h3>Acquisto</h3>
          {movie.purchase.priceBc ? <Bc value={movie.purchase.priceBc} size={20} /> : null}
          <Muted>{movie.purchase.message ?? 'Al momento non è possibile acquistare questo film.'}</Muted>
          <AutoRedeemNotice date={movie.autoRedeemAt} past={movie.outOfTheaters} />
        </Stack>
      </Card>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Card>
        <Stack $gap={10}>
          <h3>Acquisto</h3>
          <Bc value={price} size={22} />
          <Link to="/login"><Button $block>Accedi per acquistare</Button></Link>
          <AutoRedeemNotice date={movie.autoRedeemAt} />
        </Stack>
      </Card>
    );
  }

  const insufficient = price > balance;
  const err = purchase.error instanceof ApiError ? purchase.error.message : purchase.error ? 'Acquisto non riuscito' : null;

  return (
    <Card>
      <Stack $gap={14}>
        <h3>Investi in questo film</h3>
        <div>
          <Muted $size="0.8rem">Prezzo</Muted>
          <Bc value={price} size={24} />
        </div>
        <Muted $size="0.82rem">
          Paghi il prezzo una sola volta. Potrai riscattare il film quando vuoi: riceverai l’incasso attuale del film. Se l’incasso supera il prezzo pagato sei in guadagno.
        </Muted>
        <PurchaseDeadline closesAt={movie.purchase.closesAt ?? null} />
        <Stack $row $justify="space-between">
          <Muted $size="0.8rem">Saldo disponibile</Muted>
          <Muted $size="0.8rem">{formatBc(balance)}</Muted>
        </Stack>
        {insufficient && <Alert $tone="warning">Saldo Bustercoin insufficiente.</Alert>}
        {err && <Alert $tone="error">{err}</Alert>}
        {!confirming ? (
          <Button $variant="gold" $block disabled={insufficient || purchase.isPending} onClick={() => setConfirming(true)}>
            <ShoppingBag size={17} /> Acquista
          </Button>
        ) : (
          <Stack $row $gap={8}>
            <Button $variant="secondary" $block onClick={() => setConfirming(false)} disabled={purchase.isPending}>Annulla</Button>
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
              {purchase.isPending ? 'Acquisto…' : `Conferma ${formatBc(price)}`}
            </Button>
          </Stack>
        )}
        <AutoRedeemNotice date={movie.autoRedeemAt} />
        <Muted $size="0.75rem">Partecipazione virtuale di gioco: non attribuisce diritti reali sul film.</Muted>
      </Stack>
    </Card>
  );
}
