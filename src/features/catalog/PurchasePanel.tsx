import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { newIdempotencyKey, usePurchase, useWallet } from '../../api/hooks';
import type { ContentKindPath, PurchaseInfo } from '../../api/types';
import { ApiError } from '../../api/client';
import { Alert, Bc, Button, Card, Field, Input, Muted, Stack } from '../../components/ui';
import { formatBc } from '../../components/format';
import { PurchaseBadge } from '../../components/PurchaseBadge';
import { useAuthStore } from '../../store/auth';

interface Props {
  kind: ContentKindPath;
  contentId: string;
  purchase: PurchaseInfo;
  seasonId?: string;
  label: string;
}

/**
 * Pannello d'acquisto. L'acquistabilità mostrata qui è informativa: il backend ricontrolla
 * sempre stato di pubblicazione, finestra acquisti e saldo prima di addebitare.
 */
export function PurchasePanel({ kind, contentId, purchase, seasonId, label }: Props) {
  const status = useAuthStore((s) => s.status);
  const wallet = useWallet();
  const mutation = usePurchase(kind, contentId);
  const [quantity, setQuantity] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  // Una chiave per ogni "intenzione di acquisto": rigenerata solo dopo un esito definitivo.
  const [idemKey, setIdemKey] = useState(newIdempotencyKey);

  const price = purchase.priceBc ?? 0;
  const total = price * quantity;
  const balance = wallet.data?.balance ?? 0;
  const insufficient = total > balance;

  const errorMessage = useMemo(() => {
    const err = mutation.error;
    if (!err) return null;
    return err instanceof ApiError ? err.message : 'Acquisto non riuscito';
  }, [mutation.error]);

  if (!purchase.purchasable) {
    return (
      <Card>
        <Stack $gap={8}>
          <h3>Acquisto</h3>
          <PurchaseBadge active={false} reason={purchase.message ?? 'Al momento non è possibile acquistare questo titolo.'} />
          {purchase.priceBc ? <Bc value={purchase.priceBc} size={20} /> : null}
        </Stack>
      </Card>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Card>
        <Stack $gap={10}>
          <h3>Acquisto</h3>
          <PurchaseBadge active />
          <Bc value={price} size={22} />
          <Muted>Accedi per acquistare quote virtuali.</Muted>
          <Link to="/login">
            <Button $block>Accedi</Button>
          </Link>
        </Stack>
      </Card>
    );
  }

  const submit = () => {
    mutation.mutate(
      { quantity, seasonId, idempotencyKey: idemKey },
      {
        onSuccess: (r) => {
          setDone(`Acquistate ${r.units} quote per ${formatBc(r.amount)}. Nuovo saldo: ${formatBc(r.balanceAfter)}.`);
          setConfirming(false);
          setIdemKey(newIdempotencyKey());
        },
        onError: (e) => {
          // Errori definitivi (saldo, acquisti chiusi): la prossima richiesta è una nuova intenzione.
          if (e instanceof ApiError && e.status >= 400 && e.status < 500) setIdemKey(newIdempotencyKey());
          setConfirming(false);
        },
      },
    );
  };

  return (
    <Card>
      <Stack $gap={14}>
        <PurchaseBadge active />
        <Stack $row $justify="space-between" $align="center">
          <h3>Acquista quote</h3>
          <Muted $size="0.8rem">{label}</Muted>
        </Stack>
        <div>
          <Muted $size="0.8rem">Prezzo per quota</Muted>
          <Bc value={price} size={22} />
        </div>
        <Field label="Quantità">
          <Input
            type="number"
            min={1}
            max={1000}
            value={quantity}
            onChange={(e) => {
              setQuantity(Math.max(1, Math.min(1000, Math.floor(Number(e.target.value) || 1))));
              setConfirming(false);
            }}
          />
        </Field>
        <Stack $row $justify="space-between" $align="center">
          <Muted>Totale</Muted>
          <Bc value={total} size={17} />
        </Stack>
        <Stack $row $justify="space-between" $align="center">
          <Muted $size="0.8rem">Saldo disponibile</Muted>
          <Muted $size="0.8rem">{formatBc(balance)}</Muted>
        </Stack>
        {insufficient && <Alert $tone="warning">Saldo Bustercoin insufficiente per questa quantità.</Alert>}
        {errorMessage && <Alert $tone="error">{errorMessage}</Alert>}
        {done && <Alert $tone="success">{done}</Alert>}
        {!confirming ? (
          <Button $variant="gold" $block disabled={insufficient || mutation.isPending} onClick={() => { setDone(null); setConfirming(true); }}>
            <ShoppingBag size={17} /> Acquista
          </Button>
        ) : (
          <Stack $row $gap={8}>
            <Button $variant="secondary" $block onClick={() => setConfirming(false)} disabled={mutation.isPending}>
              Annulla
            </Button>
            <Button $variant="gold" $block onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? 'Acquisto…' : `Conferma ${formatBc(total)}`}
            </Button>
          </Stack>
        )}
        <Muted $size="0.75rem">Le quote sono partecipazioni virtuali di gioco e non attribuiscono diritti reali sul contenuto.</Muted>
      </Stack>
    </Card>
  );
}
