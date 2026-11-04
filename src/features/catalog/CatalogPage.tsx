import { useState } from 'react';
import { Clapperboard, Search, Tv } from 'lucide-react';
import { useGenres, useMovies, useSeriesList, type CatalogFilters } from '../../api/hooks';
import type { PublicContent } from '../../api/types';
import { EmptyState, Grid, Input, PageHeader, Pagination, Select, Spinner, Stack, Alert } from '../../components/ui';
import { ContentCard } from './ContentCard';
import { Link } from 'react-router';

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

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Link to={kind === 'movies' ? '/app/serie' : '/app/film'} style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {kind === 'movies' ? 'Vai alle Serie TV →' : 'Vai ai Film →'}
          </Link>
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
            <Input placeholder="Cerca un titolo…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 36 }} aria-label="Cerca" />
          </div>
          <Select
            style={{ flex: '0 1 180px' }}
            aria-label="Genere"
            value={filters.genre ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value || undefined, page: 1 }))}
          >
            <option value="">Tutti i generi</option>
            {genres.data?.items.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
          <Select
            style={{ flex: '0 1 180px' }}
            aria-label="Ordinamento"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as CatalogFilters['sort'], page: 1 }))}
          >
            <option value="newest">Più recenti</option>
            <option value="title">Titolo A–Z</option>
            <option value="price">Prezzo crescente</option>
          </Select>
        </Stack>
      </form>

      {list.isLoading ? (
        <Spinner />
      ) : list.isError ? (
        <Alert $tone="error">Impossibile caricare il catalogo.</Alert>
      ) : !list.data?.items.length ? (
        <EmptyState icon={<Icon size={34} />} title={filters.q || filters.genre ? 'Nessun risultato' : 'Nessun titolo disponibile'}>
          {filters.q || filters.genre ? 'Prova con altri filtri.' : 'I nuovi titoli compariranno qui non appena saranno pubblicati.'}
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
  <CatalogView title="Film" subtitle="Film al cinema in Italia, selezionati dalla redazione." kind="movies" useList={useMovies} />
);

export const SeriesPage = () => (
  <CatalogView title="Serie TV" subtitle="Serie in streaming e in TV, con metriche del pubblico italiano." kind="tv-series" useList={useSeriesList} />
);
