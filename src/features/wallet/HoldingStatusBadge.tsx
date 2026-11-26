import styled from 'styled-components';
import { BadgeCheck, Clapperboard, Clock, HandCoins, Undo2 } from 'lucide-react';
import type { Holding } from '../../api/types';
import { Muted } from '../../components/ui';
import { formatBc, formatDate } from '../../components/format';
import { italyToday } from '../../components/time';
import { t } from '../../i18n';
import { appNow } from '../../components/clock';

/** Fase di un film posseduto, dal punto di vista dell'utente. */
export type HoldingPhase = 'ACQUISTATO' | 'IN_SALA' | 'USCITO_DALLE_SALE' | 'RISCATTATO' | 'RIMBORSATO';

export function holdingPhase(h: Holding, now: Date = appNow()): HoldingPhase {
  if (h.status === 'REFUNDED') return 'RIMBORSATO';
  if (h.status === 'REDEEMED') return 'RISCATTATO';
  if (h.autoRedeemAt && new Date(h.autoRedeemAt).getTime() <= now.getTime()) return 'USCITO_DALLE_SALE';
  if (h.releaseDate && h.releaseDate <= italyToday(now)) return 'IN_SALA';
  return 'ACQUISTATO';
}

type Tone = 'brand' | 'redeemed' | 'warning' | 'neutral';
const TONE: Record<HoldingPhase, Tone> = {
  ACQUISTATO: 'brand',
  IN_SALA: 'brand',
  USCITO_DALLE_SALE: 'warning',
  RISCATTATO: 'redeemed',
  RIMBORSATO: 'neutral',
};
const ICON = { ACQUISTATO: BadgeCheck, IN_SALA: Clapperboard, USCITO_DALLE_SALE: Clock, RISCATTATO: HandCoins, RIMBORSATO: Undo2 };

const Pill = styled.span<{ $tone: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 11px 3px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.onStatus};
  background: ${({ $tone, theme }) =>
    $tone === 'brand' ? theme.colors.brand : $tone === 'redeemed' ? theme.colors.redeemed : $tone === 'warning' ? theme.colors.warning : theme.colors.textMuted};
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const label = (phase: HoldingPhase) =>
  ({
    ACQUISTATO: t('wallet.holdingStatus.faseAcquistato'),
    IN_SALA: t('wallet.holdingStatus.faseInSala'),
    USCITO_DALLE_SALE: t('wallet.holdingStatus.faseUscito'),
    RISCATTATO: t('wallet.holdingStatus.faseRiscattato'),
    RIMBORSATO: t('wallet.holdingStatus.faseRimborsato'),
  })[phase];

/** Spiegazione breve della fase, con le date e gli importi che la riguardano. */
function detail(h: Holding, phase: HoldingPhase): string {
  switch (phase) {
    case 'ACQUISTATO':
      return h.releaseDate ? t('wallet.holdingStatus.acquistatoDettaglio', { date: formatDate(h.releaseDate) }) : t('wallet.holdingStatus.acquistatoSenzaData');
    case 'IN_SALA':
      return h.redeemable ? t('wallet.holdingStatus.inSalaRiscattabile') : t('wallet.holdingStatus.inSalaSenzaIncasso');
    case 'USCITO_DALLE_SALE':
      return t('wallet.holdingStatus.uscitoDettaglio', { date: formatDate(h.autoRedeemAt) });
    case 'RISCATTATO':
      return h.redeemedBy === 'AUTO'
        ? t('wallet.holdingStatus.riscattatoAuto', { date: formatDate(h.redeemedAt) })
        : t('wallet.holdingStatus.riscattatoUtente', { date: formatDate(h.redeemedAt) });
    case 'RIMBORSATO':
      return t('wallet.holdingStatus.rimborsatoDettaglio', { date: formatDate(h.refundedAt), amount: formatBc(h.refundedAmount ?? h.purchasePrice) });
  }
}

/**
 * Stato attuale di un film acquistato: Acquistato (in attesa dell'uscita), In sala,
 * Uscito dalle sale (riscatto automatico in corso), Riscattato, Rimborsato (film cancellato).
 * Usato nelle card di home e catalogo, nella scheda del film e nel portafoglio.
 */
export function HoldingStatusBadge({ h, showDetail = true }: { h: Holding; showDetail?: boolean }) {
  const phase = holdingPhase(h);
  const Icon = ICON[phase];
  return (
    <Wrap data-testid="holding-status" data-phase={phase}>
      <Head>
        <Muted as="span" $size="0.76rem">{t('wallet.holdingStatus.stato')}</Muted>
        <Pill $tone={TONE[phase]}>
          <Icon size={12} aria-hidden strokeWidth={3} /> {label(phase)}
        </Pill>
      </Head>
      {showDetail && <Muted $size="0.76rem">{detail(h, phase)}</Muted>}
    </Wrap>
  );
}
