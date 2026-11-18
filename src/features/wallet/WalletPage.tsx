import { useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet as WalletIcon } from 'lucide-react';
import { MovieHoldingCard } from './MovieHoldingCard';
import { useFeatures, useHoldings, useTransactions, useWallet } from '../../api/hooks';
import type { Features, Holding } from '../../api/types';
import { Badge, Bc, Card, EmptyState, Gain, Grid, Muted, PageHeader, Pagination, Spinner, Stack, Tab, Tabs, Table, TableScroll } from '../../components/ui';
import { formatBc, formatDate, formatDateTime, formatPct, LEDGER_LABELS } from '../../components/format';
import { Poster } from '../../components/Poster';
import { media, theme } from '../../theme/theme';
import { t, tx } from '../../i18n';

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

// Colori della distribuzione dal tema (blu del marchio e una sua tinta chiara).
const PIE_COLORS = theme.colors.chart;

type Filter = 'all' | 'MOVIE' | 'TV_SERIES' | 'REDEEMED' | 'REFUNDED';

function SeriesHoldingRow({ h }: { h: Holding }) {
  const seriesEnabled = !!useFeatures().data?.tvSeries;
  const linkable = h.available && seriesEnabled;
  const title = (
    <div style={{ fontWeight: 600 }}>
      {h.title}
      {h.seasonNumber ? t('wallet.walletPage.stagioneBreve', { number: h.seasonNumber }) : ''}
    </div>
  );
  return (
    <SeriesRow>
      <Poster src={h.posterUrl} alt="" kind="TV_SERIES" />
      <div style={{ minWidth: 0 }}>
        {linkable ? <Link to={`/app/serie/${h.contentId}`}>{title}</Link> : title}
        <Muted $size="0.8rem">
          {tx('wallet.walletPage.unitsQuoteInvestitiTotalinvestedDal', { units: h.units, totalInvested: formatBc(h.totalInvested), firstPurchasedAt: formatDate(h.firstPurchasedAt) })}
        </Muted>
        {!h.available && <Badge $tone="amber" style={{ marginTop: 4 }}>{t('wallet.walletPage.nonPiuInCatalogo')}</Badge>}
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
  const features = useFeatures().data;
  const [filter, setFilter] = useState<Filter>('all');

  if (wallet.isLoading) return <Spinner />;
  const w = wallet.data;
  const all = holdings.data?.items ?? [];
  // "Tutti": film aperti e poi riscattati (l'ordine arriva dal server); "Film": solo aperti; "Riscattati": solo chiusi.
  const movies = all.filter(
    (h) =>
      h.contentType === 'MOVIE' &&
      (filter === 'all' || (filter === 'REDEEMED' ? h.status === 'REDEEMED' : filter === 'REFUNDED' ? h.status === 'REFUNDED' : h.status === 'OPEN')),
  );
  const series = all.filter((h) => h.contentType === 'TV_SERIES');
  const showMovies = filter === 'all' || filter === 'MOVIE' || filter === 'REDEEMED' || filter === 'REFUNDED';
  const hasRefunded = all.some((h) => h.status === 'REFUNDED');
  const showSeries = filter === 'all' || filter === 'TV_SERIES';
  const pieData = w
    ? [
        { name: t('common.film'), value: w.distribution.movies.value },
        { name: t('common.serieTv'), value: w.distribution.tvSeries.value },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <>
      <PageHeader title={t('wallet.walletPage.portafoglio')} subtitle={t('wallet.walletPage.saldoSpendibileEPartecipazioniVirtuali')} actions={<Link to="/app/movimenti">{t('wallet.walletPage.storicoMovimenti')}</Link>} />
      {w && (
        <Summary>
          <Card>
            <Muted $size="0.8rem">{t('wallet.walletPage.saldoSpendibile')}</Muted>
            <Bc value={w.balance} size={22} />
          </Card>
          <Card>
            <Muted $size="0.8rem">{t('wallet.walletPage.valorePartecipazioni')}</Muted>
            <Bc value={w.holdingsValue} size={18} />
          </Card>
          <Card>
            <Muted $size="0.8rem">{t('wallet.walletPage.guadagnoTotale')}</Muted>
            <Gain value={w.totalGain} size={17} />
            <Muted $size="0.72rem">{tx('wallet.walletPage.realizzatoRealizedgainInCorsoUnrealizedgain', { realizedGain: formatBc(w.realizedGain, true), unrealizedGain: formatBc(w.unrealizedGain, true) })}</Muted>
          </Card>
          <Card>
            <Muted $size="0.8rem">{t('wallet.walletPage.rendimento')}</Muted>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatPct(w.returnPct)}</div>
            <Muted $size="0.72rem">{t('wallet.walletPage.soloPartecipazioniEsclusiBonusE')}</Muted>
          </Card>
        </Summary>
      )}

      <Split>
        <Card>
          <h3 style={{ marginBottom: 10 }}>{t('wallet.walletPage.distribuzione')}</h3>
          {pieData.length ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} stroke="none">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatBc(Number(v))} contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Muted>{t('wallet.walletPage.nessunaPartecipazioneAperta')}</Muted>
          )}
          {w && (
            <Stack $gap={6} style={{ marginTop: 8 }}>
              <Stack $row $justify="space-between"><Muted>{tx('wallet.walletPage.filmCount', { count: w.distribution.movies.count })}</Muted><Bc value={w.distribution.movies.value} size={13} /></Stack>
              <Stack $row $justify="space-between"><Muted>{tx('wallet.walletPage.serieTvCount', { count: w.distribution.tvSeries.count })}</Muted><Bc value={w.distribution.tvSeries.value} size={13} /></Stack>
            </Stack>
          )}
        </Card>

        <Card>
          <Stack $row $justify="space-between" $align="center" $wrap style={{ marginBottom: 12 }}>
            <h3>{t('wallet.walletPage.partecipazioni')}</h3>
            <Tabs style={{ margin: 0 }}>
              <Tab $active={filter === 'all'} onClick={() => setFilter('all')}>{t('wallet.walletPage.tutti')}</Tab>
              {features?.movies && <Tab $active={filter === 'MOVIE'} onClick={() => setFilter('MOVIE')}>{t('common.film')}</Tab>}
              {features?.tvSeries && <Tab $active={filter === 'TV_SERIES'} onClick={() => setFilter('TV_SERIES')}>{t('common.serieTv')}</Tab>}
              <Tab $active={filter === 'REDEEMED'} onClick={() => setFilter('REDEEMED')}>{t('wallet.walletPage.riscattati')}</Tab>
              {hasRefunded && <Tab $active={filter === 'REFUNDED'} onClick={() => setFilter('REFUNDED')}>{t('wallet.walletPage.rimborsati')}</Tab>}
            </Tabs>
          </Stack>
          {holdings.isLoading ? (
            <Spinner />
          ) : (showMovies ? movies.length : 0) + (showSeries ? series.length : 0) === 0 ? (
            <EmptyState icon={<WalletIcon size={30} />} title={filter === 'REDEEMED' ? t('wallet.walletPage.nessunFilmRiscattato') : t('wallet.walletPage.nessunaPartecipazione')}>
              {filter !== 'REDEEMED' && (
                <>{tx('wallet.walletPage.esploraIlLinkPerIniziare', { link: <Link to="/app/film" style={{ textDecoration: 'underline' }}>{t('wallet.walletPage.catalogo')}</Link> })}</>
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
                  {filter === 'all' && <h3 style={{ margin: '4px 0 4px', fontSize: '0.95rem' }}>{t('common.serieTv')}</h3>}
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

const CATEGORIES: Array<[string | undefined, string, keyof Features | null]> = [
  [undefined, t('wallet.walletPage.tutti'), null],
  ['movies', t('common.film'), 'movies'],
  ['series', t('common.serieTv'), 'tvSeries'],
  ['earnings', t('wallet.walletPage.guadagni'), null],
  ['purchases', t('wallet.walletPage.acquisti'), null],
  ['bonus', t('wallet.walletPage.bonus'), null],
  ['prizes', t('common.premi'), null],
];

export function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>();
  const tx = useTransactions(page, category);
  const features = useFeatures().data;

  return (
    <>
      <PageHeader title={t('wallet.walletPage.storicoMovimenti2')} subtitle={t('wallet.walletPage.registroContabileImmutabileDiTutti')} />
      <Tabs>
        {CATEGORIES.filter(([, , f]) => !f || !!features?.[f]).map(([key, label]) => (
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
                  <th>{t('wallet.walletPage.data')}</th>
                  <th>{t('wallet.walletPage.tipo')}</th>
                  <th>{t('wallet.walletPage.descrizione')}</th>
                  <th style={{ textAlign: 'right' }}>{t('wallet.walletPage.importo')}</th>
                  <th style={{ textAlign: 'right' }}>{t('wallet.walletPage.saldo')}</th>
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
                  <tr><td colSpan={5}><Muted>{t('wallet.walletPage.nessunMovimentoInQuestaCategoria')}</Muted></td></tr>
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
