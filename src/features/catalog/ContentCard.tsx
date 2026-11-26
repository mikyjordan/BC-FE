import { Link } from 'react-router';
import styled from 'styled-components';
import type { PublicContent } from '../../api/types';
import { useHoldings } from '../../api/hooks';
import { OwnedMovieStatus } from './OwnedMovieStatus';
import { Poster } from '../../components/Poster';
import { Bc, Muted } from '../../components/ui';
import { AutoRedeemNotice } from './AutoRedeemNotice';
import { PurchaseBadge } from '../../components/PurchaseBadge';
import { PurchaseDeadlineNote } from './PurchaseDeadlineNote';
import { t } from '../../i18n';

const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  img { transition: transform 0.25s; }
`;

/** Tutta la card (anche la scadenza d'acquisto sotto il link) si evidenzia al passaggio del mouse. */
const Wrap = styled.div<{ $unavailable?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  margin: -8px;
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.surface}; }
  &:hover img { transform: scale(1.03); }
  /* Film non più acquistabile (per qualsiasi motivo): card in penombra, in grigio. */
  ${({ $unavailable }) =>
    $unavailable &&
    `
    filter: grayscale(1);
    opacity: 0.55;
    transition: opacity 0.2s, filter 0.2s, background 0.15s;
    &:hover, &:focus-within { opacity: 0.85; }
  `}
`;

const Title = styled.h3`
  font-size: 0.95rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export function contentPath(c: Pick<PublicContent, 'id' | 'kind'>) {
  return c.kind === 'MOVIE' ? `/app/film/${c.id}` : `/app/serie/${c.id}`;
}

export function ContentCard({ item }: { item: PublicContent }) {
  const holdings = useHoldings();
  const owned = item.kind === 'MOVIE' ? holdings.data?.items.find((h) => h.contentType === 'MOVIE' && h.contentId === item.id) : undefined;
  const meta = item.kind === 'MOVIE' ? item.genres.slice(0, 2).join(' · ') : item.platforms.slice(0, 2).join(' · ');
  // Sotto il film acquistabile: fino a quando. Il link "Come funziona" sta fuori dal link della card.
  const deadline = item.kind === 'MOVIE' && !owned && item.purchase.purchasable ? item.purchase.closesAt : null;
  // Grigio/penombra quando il film non è più acquistabile: chiusura acquisti, uscito, riscattato, ecc.
  const unavailable = item.kind === 'MOVIE' && !item.purchase.purchasable;
  return (
    <Wrap $unavailable={unavailable} data-unavailable={unavailable ? 'true' : undefined} data-testid="content-card">
      <CardLink to={contentPath(item)}>
        <div style={{ position: 'relative' }}>
          <Poster src={item.posterUrl} alt={item.title} kind={item.kind} />
        </div>
        <div>
          <Title>{item.title}</Title>
          {meta && <Muted $size="0.8rem">{meta}</Muted>}
        </div>
        {owned && item.kind === 'MOVIE' ? (
          <>
            <OwnedMovieStatus h={owned} />
            {owned.status === 'OPEN' && <AutoRedeemNotice date={item.autoRedeemAt} past={item.outOfTheaters} />}
          </>
        ) : (
          <>
            {item.purchase.priceBc ? (
              <Bc value={item.purchase.priceBc} size={13} />
            ) : (
              <Muted $size="0.8rem">{t('catalog.contentCard.prezzoNonAncoraDefinito')}</Muted>
            )}
            <PurchaseBadge active={item.purchase.purchasable} reason={item.purchase.message} showReason={false} />
            {item.kind === 'MOVIE' && <AutoRedeemNotice date={item.autoRedeemAt} past={item.outOfTheaters} />}
          </>
        )}
      </CardLink>
      {deadline && <PurchaseDeadlineNote closesAt={deadline} />}
    </Wrap>
  );
}
