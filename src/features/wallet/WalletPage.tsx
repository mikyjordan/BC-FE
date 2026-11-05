import { useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet as WalletIcon } from 'lucide-react';
import { MovieHoldingCard } from './MovieHoldingCard';
import { useHoldings, useTransactions, useWallet } from '../../api/hooks';
import type { Holding } from '../../api/types';
import { Badge, Bc, Card, EmptyState, Gain, Grid, Muted, PageHeader, Pagination, Spinner, Stack, Tab, Tabs, Table, TableScroll } from '../../components/ui';
import { formatBc, formatDate, formatDateTime, formatPct, LEDGER_LABELS } from '../../components/format';
import { Poster } from '../../components/Poster';
import { media } from '../../theme/theme';

const Summary = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 26px;
  ${media.md} { grid-template-columns: repeat(4, 1fr); }
`;

const Split = styled.div`
  display: grid;
  gap: 18px;
  margin-bottom: 26px;
  ${media.md} { grid-template-columns: 1fr 2fr; }
`;

const SeriesRow = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: 0; }
`;

// Colori neutri/blu per la distribuzione (l'oro resta riservato agli importi).
const PIE_COLORS = ['#4F6BD8', '#8FA3EE'];

type Filter = 'all' | 'MOVIE' | 'TV_SERIES' | 'REDEEMED';

function SeriesHoldingRow({ h }: { h: Holding }) {
  const title = (
    <div style={{ fontWeight: 600 }}>
      {h.title}
      {h.seasonNumber ? ` — S${h.seasonNumber}` : ''}
    </div>
  );
  return (
    <SeriesRow>
      <Poster src={h.posterUrl} alt="" kind="TV_SERIES" />
      <div style={{ minWidth: 0 }}>
        {h.available ? <Link to={`/app/serie/${h.contentId}`}>{title}</Link> : title}
        <Muted $size="0.8rem">
          {h.units} quote · investiti {formatBc(h.totalInvested)} · dal {formatDate(h.firstPurchasedAt)}
        </Muted>
        {!h.available && <Badge $tone="amber" style={{ marginTop: 4 }}>Non più in catalogo</Badge>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <Bc value={h.currentValue} size={14} />
      </div>
    </SeriesRow>
  );
}

export function WalletPage() {
  const wallet = useWallet();
  const holdings = useHoldings();
  const [filter, setFilter] = useState<Filter>('all');

  if (wallet.isLoading) return <Spinner />;
  const w = wallet.data;
  const all = holdings.data?.items ?? [];
  // "Tutti": film aperti e poi riscattati (l'ordine arriva dal server); "Film": solo aperti; "Riscattati": solo chiusi.
  const movies = all.filter(
    (h) => h.contentType === 'MOVIE' && (filter === 'all' || (filter === 'REDEEMED' ? h.status === 'REDEEMED' : h.status === 'OPEN')),
  );
  const series = all.filter((h) => h.contentType === 'TV_SERIES');
  const showMovies = filter === 'all' || filter === 'MOVIE' || filter === 'REDEEMED';
  const showSeries = filter === 'all' || filter === 'TV_SERIES';
  const pieData = w
    ? [
        { name: 'Film', value: w.distribution.movies.value },
        { name: 'Serie TV', value: w.distribution.tvSeries.value },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <>
      <PageHeader title="Portafoglio" subtitle="Saldo spendibile e partecipazioni virtuali sono tenuti separati." actions={<Link to="/app/movimenti">Storico movimenti →</Link>} />
      {w && (
        <Summary>
          <Card>
            <Muted $size="0.8rem">Saldo spendibile</Muted>
            <Bc value={w.balance} size={22} />
          </Card>
          <Card>
            <Muted $size="0.8rem">Valore partecipazioni</Muted>
            <Bc value={w.holdingsValue} size={18} />
          </Card>
          <Card>
            <Muted $size="0.8rem">Guadagno totale</Muted>
            <Gain value={w.totalGain} size={17} />
            <Muted $size="0.72rem">Realizzato {formatBc(w.realizedGain, true)} · in corso {formatBc(w.unrealizedGain, true)}</Muted>
          </Card>
          <Card>
            <Muted $size="0.8rem">Rendimento</Muted>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatPct(w.returnPct)}</div>
            <Muted $size="0.72rem">Solo partecipazioni, esclusi bonus e ricariche</Muted>
          </Card>
        </Summary>
      )}

      <Split>
        <Card>
          <h3 style={{ marginBottom: 10 }}>Distribuzione</h3>
          {pieData.length ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatBc(Number(v))} contentStyle={{ background: '#0F172E', border: '1px solid #22305A', borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Muted>Nessuna partecipazione aperta.</Muted>
          )}
          {w && (
            <Stack $gap={6} style={{ marginTop: 8 }}>
              <Stack $row $justify="space-between"><Muted>Film ({w.distribution.movies.count})</Muted><Bc value={w.distribution.movies.value} size={13} /></Stack>
              <Stack $row $justify="space-between"><Muted>Serie TV ({w.distribution.tvSeries.count})</Muted><Bc value={w.distribution.tvSeries.value} size={13} /></Stack>
            </Stack>
          )}
        </Card>

        <Card>
          <Stack $row $justify="space-between" $align="center" $wrap style={{ marginBottom: 12 }}>
            <h3>Partecipazioni</h3>
            <Tabs style={{ margin: 0 }}>
              <Tab $active={filter === 'all'} onClick={() => setFilter('all')}>Tutti</Tab>
              <Tab $active={filter === 'MOVIE'} onClick={() => setFilter('MOVIE')}>Film</Tab>
              <Tab $active={filter === 'TV_SERIES'} onClick={() => setFilter('TV_SERIES')}>Serie TV</Tab>
              <Tab $active={filter === 'REDEEMED'} onClick={() => setFilter('REDEEMED')}>Riscattati</Tab>
            </Tabs>
          </Stack>
          {holdings.isLoading ? (
            <Spinner />
          ) : (showMovies ? movies.length : 0) + (showSeries ? series.length : 0) === 0 ? (
            <EmptyState icon={<WalletIcon size={30} />} title={filter === 'REDEEMED' ? 'Nessun film riscattato' : 'Nessuna partecipazione'}>
              {filter !== 'REDEEMED' && (
                <>Esplora il <Link to="/app/film" style={{ textDecoration: 'underline' }}>catalogo</Link> per iniziare a investire.</>
              )}
            </EmptyState>
          ) : (
            <Stack $gap={18}>
              {showMovies && movies.length > 0 && (
                <Grid $min={250} $gap={14}>
                  {movies.map((h) => <MovieHoldingCard key={h.id} h={h} />)}
                </Grid>
              )}
              {showSeries && series.length > 0 && (
                <div>
                  {filter === 'all' && <h3 style={{ margin: '4px 0 4px', fontSize: '0.95rem' }}>Serie TV</h3>}
                  {series.map((h) => <SeriesHoldingRow key={h.id} h={h} />)}
                </div>
              )}
            </Stack>
          )}
        </Card>
      </Split>
    </>
  );
}

const CATEGORIES: Array<[string | undefined, string]> = [
  [undefined, 'Tutti'],
  ['movies', 'Film'],
  ['series', 'Serie TV'],
  ['earnings', 'Guadagni'],
  ['purchases', 'Acquisti'],
  ['bonus', 'Bonus'],
  ['prizes', 'Premi'],
];

export function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const tx = useTransactions(page, category);

  return (
    <>
      <PageHeader title="Storico movimenti" subtitle="Registro contabile immutabile di tutti i movimenti Bustercoin." />
      <Tabs>
        {CATEGORIES.map(([key, label]) => (
          <Tab key={label} $active={category === key} onClick={() => { setCategory(key); setPage(1); }}>
            {label}
          </Tab>
        ))}
      </Tabs>
      <Card $padding="6px 10px">
        {tx.isLoading ? (
          <Spinner />
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrizione</th>
                  <th style={{ textAlign: 'right' }}>Importo</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {tx.data?.items.map((t) => (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: 'nowrap' }}><Muted $size="0.85rem">{formatDateTime(t.createdAt)}</Muted></td>
                    <td><Badge>{LEDGER_LABELS[t.type] ?? t.type}</Badge></td>
                    <td>{t.description}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><Bc value={t.amount} signed size={13} /></td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><Muted $size="0.85rem">{formatBc(t.balanceAfter)}</Muted></td>
                  </tr>
                ))}
                {tx.data?.items.length === 0 && (
                  <tr><td colSpan={5}><Muted>Nessun movimento in questa categoria.</Muted></td></tr>
                )}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>
      {tx.data && <Pagination page={page} totalPages={tx.data.totalPages} onChange={setPage} />}
    </>
  );
}
