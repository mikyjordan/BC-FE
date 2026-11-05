import { useState } from 'react';
import { Clapperboard, Search, Tv } from 'lucide-react';
import { useFeatures, useGenres, useMovies, useSeriesList, type CatalogFilters } from '../../api/hooks';
import type { PublicContent } from '../../api/types';
import { EmptyState, Grid, Input, PageHeader, Pagination, Select, Spinner, Stack, Alert } from '../../components/ui';
import { ContentCard } from './ContentCard';
import { Link } from 'react-router';
import { t } from '../../i18n';

function CatalogView({
  title,
  subtitle,
  kind,
  useList,
}: {
  title: string;
  subtitle: string;
  kind: 'movies' | 'tv-series';
  useList: (f: CatalogFilters) => { data?: { items: PublicContent[]; totalPages: number; total: number }; isLoading: boolean; isError: boolean };
}) {
  const [filters, setFilters] = useState<CatalogFilters>({ page: 1, sort: 'newest' });
  const [q, setQ] = useState('');
  const list = useList(filters);
  const genres = useGenres(kind);
  const Icon = kind === 'movies' ? Clapperboard : Tv;
  const features = useFeatures().data;
  const otherEnabled = kind === 'movies' ? features?.tvSeries : features?.movies;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          otherEnabled && (
            <Link to={kind === 'movies' ? '/app/serie' : '/app/film'} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {kind === 'movies' ? t('catalog.catalogPage.vaiAlleSerieTv') : t('catalog.catalogPage.vaiAiFilm')}
            </Link>
          )
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((f) => ({ ...f, q: q.trim() || undefined, page: 1 }));
        }}
      >
        <Stack $row $wrap $gap={10} style={{ marginBottom: 22 }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, opacity: 0.5 }} />
            <Input placeholder={t('catalog.catalogPage.cercaUnTitolo')} value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 36 }} aria-label={t('catalog.catalogPage.cerca')} />
          </div>
          <Select
            style={{ flex: '0 1 180px' }}
            aria-label={t('catalog.catalogPage.genere')}
            value={filters.genre ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value || undefined, page: 1 }))}
          >
            <option value="">{t('catalog.catalogPage.tuttiIGeneri')}</option>
            {genres.data?.items.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
          <Select
            style={{ flex: '0 1 180px' }}
            aria-label={t('catalog.catalogPage.ordinamento')}
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as CatalogFilters['sort'], page: 1 }))}
          >
            <option value="newest">{t('catalog.catalogPage.piuRecenti')}</option>
            <option value="title">{t('catalog.catalogPage.titoloAZ')}</option>
            <option value="price">{t('catalog.catalogPage.prezzoCrescente')}</option>
          </Select>
        </Stack>
      </form>

      {list.isLoading ? (
        <Spinner />
      ) : list.isError ? (
        <Alert $tone="error">{t('catalog.catalogPage.impossibileCaricareIlCatalogo')}</Alert>
      ) : !list.data?.items.length ? (
        <EmptyState icon={<Icon size={34} />} title={filters.q || filters.genre ? t('catalog.catalogPage.nessunRisultato') : t('catalog.catalogPage.nessunTitoloDisponibile')}>
          {filters.q || filters.genre ? t('catalog.catalogPage.provaConAltriFiltri') : t('catalog.catalogPage.iNuoviTitoliComparirannoQui')}
        </EmptyState>
      ) : (
        <>
          <Grid $min={150} $gap={22}>
            {list.data.items.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </Grid>
          <Pagination page={filters.page} totalPages={list.data.totalPages} onChange={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}
    </>
  );
}

export const MoviesPage = () => (
  <CatalogView title={t('common.film')} subtitle={t('catalog.catalogPage.filmAlCinemaInItalia')} kind="movies" useList={useMovies} />
);

export const SeriesPage = () => (
  <CatalogView title={t('common.serieTv')} subtitle={t('catalog.catalogPage.serieInStreamingEIn')} kind="tv-series" useList={useSeriesList} />
);
