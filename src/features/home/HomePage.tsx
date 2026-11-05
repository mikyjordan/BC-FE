import { Link, useLocation } from 'react-router';
import styled from 'styled-components';
import { Clapperboard, Gift, Sparkles, Trophy, Tv } from 'lucide-react';
import { useHome, useTransactions, useWallet } from '../../api/hooks';
import { Alert, Bc, Card, Gain, EmptyState, Grid, Muted, SectionTitle, Spinner, Stack } from '../../components/ui';
import { formatDateTime, formatPct, LEDGER_LABELS } from '../../components/format';
import { useAuthStore } from '../../store/auth';
import { ContentCard } from '../catalog/ContentCard';
import { media } from '../../theme/theme';

const Stats = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 30px;
  ${media.md} { grid-template-columns: 1.4fr 1fr 1fr; }
`;

const StatCard = styled(Card)<{ $hero?: boolean }>`
  padding: 18px;
  ${({ $hero }) => ($hero ? 'grid-column: 1 / -1;' : '')}
  ${media.md} { grid-column: auto; }
`;

const Section = styled.section`
  margin-bottom: 34px;
`;

const MoreLink = styled(Link)`
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primaryHover};
`;

const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: 0; }
`;

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome;
  const home = useHome();
  const features = home.data?.features;
  const wallet = useWallet();
  const activity = useTransactions(1);

  const hasContent = !!home.data && (home.data.featured.length + home.data.movies.length + home.data.tvSeries.length > 0);

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <h1>Ciao, {user?.profile?.displayName ?? user?.username}</h1>
        <Muted style={{ marginTop: 6 }}>Ecco come sta andando il tuo portafoglio virtuale.</Muted>
      </div>

      {welcome && (
        <Alert $tone="success" style={{ marginBottom: 20 }}>
          Benvenuto in BusterCinema! Ti abbiamo accreditato 1.000.000 di Bustercoin per iniziare.
        </Alert>
      )}

      <Stats>
        <StatCard $hero>
          <Muted $size="0.8rem">Saldo disponibile</Muted>
          {wallet.data ? <Bc value={wallet.data.balance} size={28} /> : <Muted>—</Muted>}
        </StatCard>
        <StatCard>
          <Muted $size="0.8rem">Guadagni</Muted>
          {wallet.data ? <Gain value={wallet.data.totalGain} size={18} /> : <Muted>—</Muted>}
        </StatCard>
        <StatCard>
          <Muted $size="0.8rem">Rendimento</Muted>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{wallet.data ? formatPct(wallet.data.returnPct) : '—'}</div>
        </StatCard>
      </Stats>

      {home.isLoading ? (
        <Spinner />
      ) : !hasContent ? (
        <Section>
          <EmptyState icon={<Clapperboard size={34} />} title="Il sipario sta per alzarsi">
            Non ci sono ancora titoli in programmazione. Torna presto: i nuovi film e serie compariranno qui.
          </EmptyState>
        </Section>
      ) : (
        <>
          {home.data!.featured.length > 0 && (
            <Section>
              <SectionTitle>
                <Sparkles size={18} /> In evidenza
              </SectionTitle>
              <Grid $min={150} $gap={22}>
                {home.data!.featured.map((c) => (
                  <ContentCard key={`${c.kind}-${c.id}`} item={c} />
                ))}
              </Grid>
            </Section>
          )}
          {home.data!.movies.length > 0 && (
            <Section>
              <SectionTitle>
                <Clapperboard size={18} /> Film disponibili <MoreLink to="/app/film">Vedi tutti</MoreLink>
              </SectionTitle>
              <Grid $min={150} $gap={22}>
                {home.data!.movies.map((c) => (
                  <ContentCard key={c.id} item={c} />
                ))}
              </Grid>
            </Section>
          )}
          {home.data!.tvSeries.length > 0 && (
            <Section>
              <SectionTitle>
                <Tv size={18} /> Serie TV disponibili <MoreLink to="/app/serie">Vedi tutte</MoreLink>
              </SectionTitle>
              <Grid $min={150} $gap={22}>
                {home.data!.tvSeries.map((c) => (
                  <ContentCard key={c.id} item={c} />
                ))}
              </Grid>
            </Section>
          )}
        </>
      )}

      <Section>
        <Stack $row $gap={10} $wrap>
          {features?.tvSeries && (
            <Link to="/app/serie" style={{ flex: '1 1 200px' }}>
              <Card $padding="16px">
                <Stack $row $gap={10} $align="center">
                  <Tv size={18} /> <strong>Catalogo Serie TV</strong>
                </Stack>
              </Card>
            </Link>
          )}
          <Link to="/app/classifiche" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px">
              <Stack $row $gap={10} $align="center">
                <Trophy size={18} /> <strong>Classifiche</strong>
              </Stack>
            </Card>
          </Link>
          <Link to="/app/premi" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px">
              <Stack $row $gap={10} $align="center">
                <Gift size={18} /> <strong>Premi e coppe</strong>
              </Stack>
            </Card>
          </Link>
        </Stack>
      </Section>

      <Section>
        <SectionTitle>
          Attività recenti <MoreLink to="/app/movimenti">Storico</MoreLink>
        </SectionTitle>
        <Card $padding="4px 18px">
          {activity.data?.items.slice(0, 5).map((t) => (
            <ActivityRow key={t.id}>
              <div>
                <div style={{ fontWeight: 600 }}>{LEDGER_LABELS[t.type] ?? t.type}</div>
                <Muted $size="0.8rem">
                  {t.description} · {formatDateTime(t.createdAt)}
                </Muted>
              </div>
              <Bc value={t.amount} signed size={14} />
            </ActivityRow>
          ))}
          {activity.data && activity.data.items.length === 0 && <Muted style={{ padding: 16 }}>Nessuna attività.</Muted>}
        </Card>
      </Section>
    </>
  );
}
