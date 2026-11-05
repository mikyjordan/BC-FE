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
import { SuperadminNoPurchase } from '../../components/SuperadminNoPurchase';
import { t } from '../../i18n';

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
  const isSuperadmin = useAuthStore((s) => s.user?.role === 'SUPERADMIN');
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
    return err instanceof ApiError ? err.message : t('catalog.purchasePanel.acquistoNonRiuscito');
  }, [mutation.error]);

  if (!purchase.purchasable) {
    return (
      <Card>
        <Stack $gap={8}>
          <h3>{t('catalog.purchasePanel.acquisto')}</h3>
          <PurchaseBadge active={false} reason={purchase.message ?? t('catalog.purchasePanel.alMomentoNonEPossibile')} />
          {purchase.priceBc ? <Bc value={purchase.priceBc} size={20} /> : null}
        </Stack>
      </Card>
    );
  }

  if (status !== 'authenticated') {
    return (
      <Card>
        <Stack $gap={10}>
          <h3>{t('catalog.purchasePanel.acquisto')}</h3>
          <PurchaseBadge active />
          <Bc value={price} size={22} />
          <Muted>{t('catalog.purchasePanel.accediPerAcquistareQuoteVirtuali')}</Muted>
          <Link to="/login">
            <Button $block>{t('catalog.purchasePanel.accedi')}</Button>
          </Link>
        </Stack>
      </Card>
    );
  }

  if (isSuperadmin) return <SuperadminNoPurchase priceBc={purchase.priceBc} />;

  const submit = () => {
    mutation.mutate(
      { quantity, seasonId, idempotencyKey: idemKey },
      {
        onSuccess: (r) => {
          setDone(t('catalog.purchasePanel.acquistateUnitsQuotePerAmount', { units: r.units, amount: formatBc(r.amount), balanceAfter: formatBc(r.balanceAfter) }));
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
          <h3>{t('catalog.purchasePanel.acquistaQuote')}</h3>
          <Muted $size="0.8rem">{label}</Muted>
        </Stack>
        <div>
          <Muted $size="0.8rem">{t('catalog.purchasePanel.prezzoPerQuota')}</Muted>
          <Bc value={price} size={22} />
        </div>
        <Field label={t('catalog.purchasePanel.quantita')}>
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
          <Muted>{t('catalog.purchasePanel.totale')}</Muted>
          <Bc value={total} size={17} />
        </Stack>
        <Stack $row $justify="space-between" $align="center">
          <Muted $size="0.8rem">{t('catalog.purchasePanel.saldoDisponibile')}</Muted>
          <Muted $size="0.8rem">{formatBc(balance)}</Muted>
        </Stack>
        {insufficient && <Alert $tone="warning">{t('catalog.purchasePanel.saldoBustercoinInsufficientePerQuesta')}</Alert>}
        {errorMessage && <Alert $tone="error">{errorMessage}</Alert>}
        {done && <Alert $tone="success">{done}</Alert>}
        {!confirming ? (
          <Button $variant="gold" $block disabled={insufficient || mutation.isPending} onClick={() => { setDone(null); setConfirming(true); }}>
            <ShoppingBag size={17} />{' '}{t('catalog.purchasePanel.acquista')}</Button>
        ) : (
          <Stack $row $gap={8}>
            <Button $variant="secondary" $block onClick={() => setConfirming(false)} disabled={mutation.isPending}>{t('catalog.purchasePanel.annulla')}</Button>
            <Button $variant="gold" $block onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? t('catalog.purchasePanel.acquisto2') : t('catalog.purchasePanel.confermaTotal', { total: formatBc(total) })}
            </Button>
          </Stack>
        )}
        <Muted $size="0.75rem">{t('catalog.purchasePanel.leQuoteSonoPartecipazioniVirtuali')}</Muted>
      </Stack>
    </Card>
  );
}
