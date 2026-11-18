import { useState } from 'react';
import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import { HandCoins } from 'lucide-react';
import { useFeatures, useRedeem } from '../../api/hooks';
import type { Holding } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Poster } from '../../components/Poster';
import { Alert, Badge, Bc, Button, Gain, Muted, Stack } from '../../components/ui';
import { formatBc, formatDate, formatDateTime } from '../../components/format';
import { AutoRedeemNotice } from '../catalog/AutoRedeemNotice';
import { HoldingStatusBadge } from './HoldingStatusBadge';
import { t, tx } from '../../i18n';

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
      ? css`border-color: ${theme.colors.successBorder}; border-width: 2px; background: linear-gradient(180deg, ${theme.colors.successSoft}, ${theme.colors.surface} 55%);`
      : $tone === 'down'
        ? css`border-color: ${theme.colors.dangerBorder}; border-width: 2px; background: linear-gradient(180deg, ${theme.colors.dangerSoft}, ${theme.colors.surface} 55%);`
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
 * Film posseduto: stato attuale, prezzo d'acquisto, incasso attuale e guadagno/perdita
 * (verde se l'incasso supera il prezzo pagato, rosso se è inferiore). Rimborsato (film
 * cancellato): solo il prezzo restituito.
 * Il pulsante "Riscatta" accredita l'incasso attuale e chiude la partecipazione.
 */
export function MovieHoldingCard({ h, compact }: { h: Holding; compact?: boolean }) {
  const redeem = useRedeem();
  const moviesEnabled = !!useFeatures().data?.movies;
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const redeemed = h.status === 'REDEEMED';
  const refunded = h.status === 'REFUNDED';
  const closed = h.status !== 'OPEN';
  const tone: Tone = h.trend === 'UP' ? 'up' : h.trend === 'DOWN' ? 'down' : 'neutral';
  const pct = h.profit !== null && h.purchasePrice > 0 ? (h.profit / h.purchasePrice) * 100 : undefined;
  const title = <strong style={{ fontSize: '0.98rem' }}>{h.title}</strong>;

  return (
    <Wrap $tone={tone} data-testid={`holding-${h.contentId}`} aria-label={t('wallet.movieHoldingCard.filmTitle', { title: h.title })}>
      <Stack $row $gap={12} $align="flex-start">
        {!compact && (
          <div style={{ width: 64, flexShrink: 0 }}>
            <Poster src={h.posterUrl} alt="" kind="MOVIE" />
          </div>
        )}
        <Stack $gap={4} style={{ minWidth: 0, flex: 1 }}>
          {h.available && moviesEnabled ? <Link to={`/app/film/${h.contentId}`}>{title}</Link> : title}
          <Muted $size="0.78rem">{tx('wallet.movieHoldingCard.acquistatoIlFirstpurchasedat', { firstPurchasedAt: formatDate(h.firstPurchasedAt) })}</Muted>
          <HoldingStatusBadge h={h} />
          {!h.available && !closed && <Badge $tone="amber" style={{ alignSelf: 'flex-start' }}>{t('wallet.movieHoldingCard.nonPiuInCatalogo')}</Badge>}
        </Stack>
      </Stack>

      <Stack $gap={6}>
        <Row>
          <Muted>{t('wallet.movieHoldingCard.prezzoDAcquisto')}</Muted>
          <Bc value={h.purchasePrice} size={13} />
        </Row>
        {refunded ? (
          <Row>
            <Muted>{t('wallet.movieHoldingCard.rimborsato')}</Muted>
            <Bc value={h.refundedAmount ?? h.purchasePrice} size={13} />
          </Row>
        ) : redeemed ? (
          <Row>
            <Muted>{t('wallet.movieHoldingCard.riscattatoPer')}</Muted>
            <Bc value={h.redeemedAmount ?? 0} size={13} />
          </Row>
        ) : (
          <Row>
            <Muted>{t('wallet.movieHoldingCard.incassoAttuale')}</Muted>
            {h.currentGross !== null ? <Bc value={h.currentGross} size={13} /> : <Muted $size="0.85rem">{t('wallet.movieHoldingCard.nonAncoraDisponibile')}</Muted>}
          </Row>
        )}
        {!refunded && <Row>
          <Muted>{redeemed ? t('wallet.movieHoldingCard.risultato') : h.trend === 'DOWN' ? t('wallet.movieHoldingCard.perdita') : t('wallet.movieHoldingCard.guadagno')}</Muted>
          <Gain value={h.profit} size={14} pct={pct} />
        </Row>}
        {!closed && h.currentGrossAt && <Muted $size="0.72rem">{tx('wallet.movieHoldingCard.incassoAggiornatoAlCurrentgrossat', { currentGrossAt: formatDateTime(h.currentGrossAt) })}</Muted>}
      </Stack>

      {done && <Alert $tone="success">{done}</Alert>}
      {redeem.error && <Alert $tone="error">{redeem.error.message}</Alert>}

      {!closed && (
        <Button $variant="gold" $block disabled={!h.redeemable || redeem.isPending} onClick={() => { redeem.reset(); setConfirm(true); }}>
          <HandCoins size={16} />{' '}{t('wallet.movieHoldingCard.riscatta')}</Button>
      )}
      {!closed && !h.redeemable && <Muted $size="0.75rem" style={{ textAlign: 'center' }}>{t('wallet.movieHoldingCard.disponibileQuandoVerraInseritoL')}</Muted>}
      {!closed && <AutoRedeemNotice date={h.autoRedeemAt} />}

      {confirm && h.currentGross !== null && (
        <ConfirmModal
          title={t('wallet.movieHoldingCard.riscattareTitle', { title: h.title })}
          message={
            <Stack $gap={8}>
              <span>{tx('wallet.movieHoldingCard.riceveraiStrongSulTuoWallet', { strong: <strong>{formatBc(h.currentGross)}</strong> })}</span>
              <span>{tx('wallet.movieHoldingCard.rispettoAlPrezzoPagatoPurchaseprice', { purchasePrice: formatBc(h.purchasePrice) })}{' '}<Gain value={h.profit} size={14} />
              </span>
              <span>{tx('wallet.movieHoldingCard.dopoIlRiscattoIlFilm', { strong: <strong>{t('wallet.movieHoldingCard.nonPotraiPiuRiacquistarlo')}</strong> })}</span>
            </Stack>
          }
          confirmLabel={t('wallet.movieHoldingCard.riscattaCurrentgross', { currentGross: formatBc(h.currentGross) })}
          pending={redeem.isPending}
          error={redeem.error?.message}
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            redeem.mutate(h.id, {
              onSuccess: (r) => {
                setConfirm(false);
                setDone(t('wallet.movieHoldingCard.accreditatiGrossamountNuovoSaldoBalanceafter', { grossAmount: formatBc(r.grossAmount), balanceAfter: formatBc(r.balanceAfter) }));
              },
            })
          }
        />
      )}
    </Wrap>
  );
}
