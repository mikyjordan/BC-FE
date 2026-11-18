import styled from 'styled-components';
import type { Holding } from '../../api/types';
import { Bc, Gain, Muted } from '../../components/ui';
import { t } from '../../i18n';
import { HoldingStatusBadge } from '../wallet/HoldingStatusBadge';

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
 * Stato personale di un film nelle card di home e catalogo: lo stato attuale (Acquistato,
 * In sala, Uscito dalle sale, Riscattato, Rimborsato) e, secondo il caso, l'incasso corrente
 * con guadagno/perdita o la rendita accreditata.
 */
export function OwnedMovieStatus({ h }: { h: Holding }) {
  if (h.status === 'REFUNDED') {
    return (
      <Box data-testid="owned-status" data-status="REFUNDED">
        <HoldingStatusBadge h={h} />
      </Box>
    );
  }
  if (h.status === 'REDEEMED') {
    const redeemed = h.redeemedAmount ?? 0;
    return (
      <Box data-testid="owned-status" data-status="REDEEMED">
        <HoldingStatusBadge h={h} />
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
      <HoldingStatusBadge h={h} />
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
