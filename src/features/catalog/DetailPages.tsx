import { useState } from 'react';
import { Link, useParams } from 'react-router';
import styled from 'styled-components';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useMovie, useSeries } from '../../api/hooks';
import type { PublicMovie, PublicSeries } from '../../api/types';
import { Poster } from '../../components/Poster';
import { Badge, Card, EmptyState, Muted, Spinner, Stack, Tab, Tabs } from '../../components/ui';
import { formatDate } from '../../components/format';
import { media } from '../../theme/theme';
import { PurchasePanel } from './PurchasePanel';
import { BoxOfficeCard, MovieSidePanel } from './MoviePanels';
import { t, tx } from '../../i18n';

const Layout = styled.div`
  display: grid;
  gap: 24px;
  ${media.md} { grid-template-columns: 240px 1fr 320px; align-items: start; }
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 18px;
  margin: 0;
  font-size: 0.9rem;
  dt { color: ${({ theme }) => theme.colors.textMuted}; }
  dd { margin: 0; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

const Lead = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1rem;
`;

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 16px;
  font-size: 0.9rem;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

function NotAvailable({ back }: { back: string }) {
  return (
    <>
      <Back to={back}>
        <ArrowLeft size={16} />{' '}{t('catalog.detailPages.tornaAlCatalogo')}</Back>
      <EmptyState title={t('catalog.detailPages.titoloNonDisponibile')}>{t('catalog.detailPages.ilContenutoNonEsisteO')}</EmptyState>
    </>
  );
}

function fact(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '' ) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

/** Metriche delle serie: arriveranno con la Fase 6; finché non ci sono dati reali non si mostra nulla di inventato. */
function PerformancePlaceholder() {
  return (
    <Card>
      <Stack $row $gap={10} $align="center" style={{ marginBottom: 8 }}>
        <BarChart3 size={18} />
        <h3>{t('catalog.detailPages.metricheItalianeERendimento')}</h3>
      </Stack>
      <Muted>{t('catalog.detailPages.nessunaRilevazioneDisponibilePerQuesto')}</Muted>
    </Card>
  );
}

function MovieBody({ m }: { m: PublicMovie }) {
  return (
    <Layout>
      <Poster src={m.posterUrl} alt={m.title} kind="MOVIE" />
      <Stack $gap={18}>
        <div>
          <Stack $row $gap={6} $wrap style={{ marginBottom: 10 }}>
            <Badge $tone="blue">{t('common.film')}</Badge>
            {m.genres.map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </Stack>
          <h1>{m.title}</h1>
          {m.originalTitle && m.originalTitle !== m.title && <Muted>{m.originalTitle}</Muted>}
        </div>
        {m.description && <Lead>{m.description}</Lead>}
        <Facts>
          {fact(t('catalog.detailPages.regia'), m.director)}
          {fact(t('catalog.detailPages.cast'), m.cast.join(', '))}
          {fact(t('catalog.detailPages.durata'), m.durationMinutes ? t('catalog.detailPages.durataMinuti', { minutes: m.durationMinutes }) : null)}
          {fact(t('catalog.detailPages.uscitaInItalia'), m.italianReleaseDate ? formatDate(m.italianReleaseDate) : null)}
          {fact(t('catalog.detailPages.inProgrammazioneDal'), m.screeningStartDate ? formatDate(m.screeningStartDate) : null)}
          {fact(t('catalog.detailPages.finoAl'), m.screeningEndDate ? formatDate(m.screeningEndDate) : null)}
          {fact(t('catalog.detailPages.paese'), m.productionCountry)}
          {fact(t('catalog.detailPages.distribuzione'), m.distributor)}
          {fact(t('catalog.detailPages.classificazione'), m.ageRating)}
        </Facts>
        {m.plot && (
          <div>
            <h3 style={{ marginBottom: 6 }}>{t('catalog.detailPages.trama')}</h3>
            <Muted>{m.plot}</Muted>
          </div>
        )}
        <BoxOfficeCard movie={m} />
      </Stack>
      <MovieSidePanel movie={m} />
    </Layout>
  );
}

const SERIES_STATUS: Record<PublicSeries['seriesStatus'], string> = {
  ANNOUNCED: t('catalog.detailPages.annunciata'),
  ONGOING: t('catalog.detailPages.inCorso'),
  ENDED: t('catalog.detailPages.conclusa'),
  CANCELLED: t('catalog.detailPages.cancellata'),
};

function SeriesBody({ s }: { s: PublicSeries }) {
  const seasons = s.seasons ?? [];
  const [seasonId, setSeasonId] = useState<string | undefined>(seasons.find((x) => x.purchase.purchasable)?.id ?? seasons[0]?.id);
  const selected = seasons.find((x) => x.id === seasonId);

  return (
    <Layout>
      <Poster src={s.posterUrl} alt={s.title} kind="TV_SERIES" />
      <Stack $gap={18}>
        <div>
          <Stack $row $gap={6} $wrap style={{ marginBottom: 10 }}>
            <Badge $tone="blue">{t('common.serieTv')}</Badge>
            {s.platforms.map((p) => (
              <Badge key={p} $tone="neutral">{p}</Badge>
            ))}
            <Badge>{SERIES_STATUS[s.seriesStatus]}</Badge>
          </Stack>
          <h1>{s.title}</h1>
          {s.originalTitle && s.originalTitle !== s.title && <Muted>{s.originalTitle}</Muted>}
        </div>
        {s.description && <Lead>{s.description}</Lead>}
        <Facts>
          {fact(t('catalog.detailPages.ideataDa'), s.creator)}
          {fact(t('catalog.detailPages.cast'), s.cast.join(', '))}
          {fact(t('catalog.detailPages.generi'), s.genres.join(', '))}
          {fact(t('catalog.detailPages.primaUscita'), s.firstReleaseDate ? formatDate(s.firstReleaseDate) : null)}
          {fact(t('catalog.detailPages.stagioni'), s.seasonsCount)}
          {fact(t('catalog.detailPages.episodi'), s.episodesCount)}
          {fact(t('catalog.detailPages.paese'), s.productionCountry)}
          {fact(t('catalog.detailPages.fonteDeiDati'), s.dataSource)}
        </Facts>
        {seasons.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 10 }}>{t('catalog.detailPages.stagioni')}</h3>
            <Tabs>
              {seasons.map((x) => (
                <Tab key={x.id} $active={x.id === seasonId} onClick={() => setSeasonId(x.id)}>{tx('catalog.detailPages.stagioneSeasonnumber', { seasonNumber: x.seasonNumber })}
                </Tab>
              ))}
            </Tabs>
            {selected && (
              <Muted>
                {selected.title ?? t('catalog.detailPages.stagioneSeasonnumber', { seasonNumber: selected.seasonNumber })}
                {selected.episodesCount ? t('catalog.detailPages.episodescountEpisodi', { episodesCount: selected.episodesCount }) : ''}
                {selected.releaseDate ? t('catalog.detailPages.uscitaReleasedate', { releaseDate: formatDate(selected.releaseDate) }) : ''}
              </Muted>
            )}
          </div>
        )}
        <PerformancePlaceholder />
      </Stack>
      {s.holdingScope === 'SEASON' ? (
        selected ? (
          <PurchasePanel
            key={selected.id}
            kind="tv-series"
            contentId={s.id}
            seasonId={selected.id}
            purchase={{ ...selected.purchase, message: selected.purchase.purchasable ? null : t('catalog.detailPages.gliAcquistiPerQuestaStagione') }}
            label={t('catalog.detailPages.stagioneSeasonnumber', { seasonNumber: selected.seasonNumber })}
          />
        ) : (
          <Card>
            <Muted>{t('catalog.detailPages.nessunaStagioneDisponibilePerL')}</Muted>
          </Card>
        )
      ) : (
        <PurchasePanel kind="tv-series" contentId={s.id} purchase={s.purchase} label={t('catalog.detailPages.serieCompleta')} />
      )}
    </Layout>
  );
}

export function MovieDetailPage() {
  const { id = '' } = useParams();
  const q = useMovie(id);
  if (q.isLoading) return <Spinner />;
  if (!q.data) return <NotAvailable back="/app/film" />;
  return (
    <>
      <Back to="/app/film">
        <ArrowLeft size={16} />{' '}{t('common.film')}</Back>
      <MovieBody m={q.data} />
    </>
  );
}

export function SeriesDetailPage() {
  const { id = '' } = useParams();
  const q = useSeries(id);
  if (q.isLoading) return <Spinner />;
  if (!q.data) return <NotAvailable back="/app/serie" />;
  return (
    <>
      <Back to="/app/serie">
        <ArrowLeft size={16} />{' '}{t('common.serieTv')}</Back>
      <SeriesBody s={q.data} />
    </>
  );
}

export { MovieBody, SeriesBody };
