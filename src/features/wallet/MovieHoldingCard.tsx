import { useState } from 'react';
import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { HandCoins } from 'lucide-react';
import { useRedeem } from '../../api/hooks';
import type { Holding } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Poster } from '../../components/Poster';
import { Alert, Badge, Bc, Button, Gain, Muted, Stack } from '../../components/ui';
import { formatBc, formatDate, formatDateTime } from '../../components/format';

type Tone = 'up' | 'down' | 'neutral';

const Wrap = styled.article<{ $tone: Tone }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  ${({ $tone, theme }) =>
    $tone === 'up'
      ? css`border-color: rgba(63, 185, 132, 0.55); background: linear-gradient(180deg, ${theme.colors.successSoft}, ${theme.colors.surface} 55%);`
      : $tone === 'down'
        ? css`border-color: rgba(229, 86, 107, 0.55); background: linear-gradient(180deg, ${theme.colors.dangerSoft}, ${theme.colors.surface} 55%);`
        : ''}
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
`;

/**
 * Film posseduto: prezzo d'acquisto, incasso attuale e guadagno/perdita
 * (verde se l'incasso supera il prezzo pagato, rosso se è inferiore).
 * Il pulsante "Riscatta" accredita l'incasso attuale e chiude la partecipazione.
 */
export function MovieHoldingCard({ h, compact }: { h: Holding; compact?: boolean }) {
  const redeem = useRedeem();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const redeemed = h.status === 'REDEEMED';
  const tone: Tone = h.trend === 'UP' ? 'up' : h.trend === 'DOWN' ? 'down' : 'neutral';
  const pct = h.profit !== null && h.purchasePrice > 0 ? (h.profit / h.purchasePrice) * 100 : undefined;
  const title = <strong style={{ fontSize: '0.98rem' }}>{h.title}</strong>;

  return (
    <Wrap $tone={tone} data-testid={`holding-${h.contentId}`} aria-label={`Film ${h.title}`}>
      <Stack $row $gap={12} $align="flex-start">
        {!compact && (
          <div style={{ width: 64, flexShrink: 0 }}>
            <Poster src={h.posterUrl} alt="" kind="MOVIE" />
          </div>
        )}
        <Stack $gap={4} style={{ minWidth: 0, flex: 1 }}>
          {h.available ? <Link to={`/app/film/${h.contentId}`}>{title}</Link> : title}
          <Muted $size="0.78rem">Acquistato il {formatDate(h.firstPurchasedAt)}</Muted>
          <Stack $row $gap={6} $wrap>
            {redeemed && <Badge $tone="neutral">Riscattato</Badge>}
            {!h.available && !redeemed && <Badge $tone="amber">Non più in catalogo</Badge>}
          </Stack>
        </Stack>
      </Stack>

      <Stack $gap={6}>
        <Row>
          <Muted>Prezzo d’acquisto</Muted>
          <Bc value={h.purchasePrice} size={13} />
        </Row>
        {redeemed ? (
          <Row>
            <Muted>Riscattato per</Muted>
            <Bc value={h.redeemedAmount ?? 0} size={13} />
          </Row>
        ) : (
          <Row>
            <Muted>Incasso attuale</Muted>
            {h.currentGross !== null ? <Bc value={h.currentGross} size={13} /> : <Muted $size="0.85rem">Non ancora disponibile</Muted>}
          </Row>
        )}
        <Row>
          <Muted>{redeemed ? 'Risultato' : h.trend === 'DOWN' ? 'Perdita' : 'Guadagno'}</Muted>
          <Gain value={h.profit} size={14} pct={pct} />
        </Row>
        {!redeemed && h.currentGrossAt && <Muted $size="0.72rem">Incasso aggiornato al {formatDateTime(h.currentGrossAt)}</Muted>}
        {redeemed && h.redeemedAt && <Muted $size="0.72rem">Riscattato il {formatDateTime(h.redeemedAt)}</Muted>}
      </Stack>

      {done && <Alert $tone="success">{done}</Alert>}
      {redeem.error && <Alert $tone="error">{redeem.error.message}</Alert>}

      {!redeemed && (
        <Button $variant="gold" $block disabled={!h.redeemable || redeem.isPending} onClick={() => { redeem.reset(); setConfirm(true); }}>
          <HandCoins size={16} /> Riscatta
        </Button>
      )}
      {!redeemed && !h.redeemable && <Muted $size="0.75rem" style={{ textAlign: 'center' }}>Disponibile quando verrà inserito l’incasso del film</Muted>}

      {confirm && h.currentGross !== null && (
        <ConfirmModal
          title={`Riscattare “${h.title}”?`}
          message={
            <Stack $gap={8}>
              <span>Riceverai <strong>{formatBc(h.currentGross)}</strong> sul tuo wallet (incasso attuale del film).</span>
              <span>
                Rispetto al prezzo pagato ({formatBc(h.purchasePrice)}): <Gain value={h.profit} size={14} />
              </span>
              <span>Dopo il riscatto il film esce dal portafoglio e <strong>non potrai più riacquistarlo</strong>.</span>
            </Stack>
          }
          confirmLabel={`Riscatta ${formatBc(h.currentGross)}`}
          pending={redeem.isPending}
          error={redeem.error?.message}
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            redeem.mutate(h.id, {
              onSuccess: (r) => {
                setConfirm(false);
                setDone(`Accreditati ${formatBc(r.grossAmount)}. Nuovo saldo: ${formatBc(r.balanceAfter)}.`);
              },
            })
          }
        />
      )}
    </Wrap>
  );
}
