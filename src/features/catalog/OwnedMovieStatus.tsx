import styled from 'styled-components';
import { BadgeCheck, Lock } from 'lucide-react';
import type { Holding } from '../../api/types';
import { Bc, Gain, Muted } from '../../components/ui';
import { formatDate } from '../../components/format';
import { t, tx } from '../../i18n';

const Pill = styled.span<{ $tone: 'owned' | 'redeemed' }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 3px 11px 3px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
  color: #ffffff;
  background: ${({ $tone, theme }) => ($tone === 'owned' ? theme.colors.brand : theme.colors.danger)};
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 0.8rem;
`;

/**
 * Stato personale di un film nelle card di home e catalogo:
 *  - acquistato → "Già acquistato" con l'incasso corrente (e guadagno/perdita);
 *  - riscattato → "Non acquistabile", con data del riscatto e rendita accreditata.
 */
export function OwnedMovieStatus({ h }: { h: Holding }) {
  if (h.status === 'REDEEMED') {
    const redeemed = h.redeemedAmount ?? 0;
    return (
      <Box data-testid="owned-status" data-status="REDEEMED">
        <Pill $tone="redeemed">
          <Lock size={12} aria-hidden strokeWidth={3} />{' '}{t('catalog.ownedMovieStatus.nonAcquistabile')}</Pill>
        <Muted $size="0.8rem">{tx('catalog.ownedMovieStatus.giaRiscattatoIlRedeemedatV', { redeemedAt: formatDate(h.redeemedAt), v: h.redeemedBy === 'AUTO' ? t('catalog.ownedMovieStatus.riscattoAutomatico') : '' })}
        </Muted>
        <Line>
          <Muted as="span" $size="0.8rem">{t('catalog.ownedMovieStatus.rendita')}</Muted>
          <Bc value={redeemed} size={13} />
          <Gain value={redeemed - h.purchasePrice} size={12} />
        </Line>
      </Box>
    );
  }
  return (
    <Box data-testid="owned-status" data-status="OPEN">
      <Pill $tone="owned">
        <BadgeCheck size={12} aria-hidden strokeWidth={3} />{' '}{t('catalog.ownedMovieStatus.giaAcquistato')}</Pill>
      <Line>
        <Muted as="span" $size="0.8rem">{t('catalog.ownedMovieStatus.incassoCorrente')}</Muted>
        {h.currentGross !== null ? <Bc value={h.currentGross} size={13} /> : <Muted as="span" $size="0.8rem">{t('catalog.ownedMovieStatus.nonAncoraDisponibile')}</Muted>}
      </Line>
      {h.currentGross !== null && (
        <Line>
          <Muted as="span" $size="0.8rem">{t('catalog.ownedMovieStatus.pagato')}</Muted>
          <Bc value={h.purchasePrice} size={12} />
          <Gain value={h.profit} size={12} />
        </Line>
      )}
    </Box>
  );
}
