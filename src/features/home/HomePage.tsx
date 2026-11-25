import { Link, useLocation } from 'react-router';
import styled from 'styled-components';
import { ChevronRight, Clapperboard, Gift, Trophy, Tv } from 'lucide-react';
import { useHome, useMyMovies, useTransactions, useWallet } from '../../api/hooks';
import { Alert, Bc, Card, Gain, EmptyState, Grid, Muted, SectionTitle, Spinner, Stack } from '../../components/ui';
import { formatDateTime, formatNumber, formatPct, LEDGER_LABELS } from '../../components/format';
import { hasWallet, useAuthStore } from '../../store/auth';
import { ContentCard } from '../catalog/ContentCard';
import { media } from '../../theme/theme';
import { t, tx } from '../../i18n';

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

/** Riga di un acquisto film: porta alla scheda del film. */
const ActivityLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 8px;
  margin: 0 -8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: inherit;
  text-decoration: none;
  &:last-child { border-bottom: 0; }
  &:hover { background: ${({ theme }) => theme.colors.bg}; }
  &:focus-visible { outline: 2px solid ${({ theme }) => theme.colors.brand}; outline-offset: -2px; }
`;

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const withWallet = hasWallet(user);
  const location = useLocation();
  const welcomeBonus = (location.state as { welcomeBonus?: number } | null)?.welcomeBonus;
  const home = useHome();
  const features = home.data?.features;
  const wallet = useWallet();
  const activity = useTransactions(1);
  // Nella dashboard dell'utente compaiono solo i film che ha acquistato; il Superadmin, che non
  // compra, vede quelli in homepage.
  const myMovies = useMyMovies();
  const movies = withWallet ? (myMovies.data?.items ?? []) : (home.data?.movies ?? []);
  const showMovies = features?.movies !== false && (withWallet || movies.length > 0);

  const hasContent = !!home.data && (showMovies || home.data.tvSeries.length > 0);

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <h1>{tx('home.homePage.ciaoDisplayname', { displayName: user?.username })}</h1>
        <Muted style={{ marginTop: 6 }}>{withWallet ? t('home.homePage.eccoComeStaAndandoIl') : t('home.homePage.ilSuperadminGestisceLaPiattaforma')}</Muted>
      </div>

      {welcomeBonus !== undefined && (
        <Alert $tone="success" style={{ marginBottom: 20 }} data-testid="welcome">
          {welcomeBonus > 0 ? t('home.homePage.benvenutoInBustercinemaTiAbbiamo', { amount: formatNumber(welcomeBonus) }) : t('home.homePage.accountAttivato')}
        </Alert>
      )}

      {withWallet && (
      <Stats>
        <StatCard $hero>
          <Muted $size="0.8rem">{t('home.homePage.saldoDisponibile')}</Muted>
          {wallet.data ? <Bc value={wallet.data.balance} size={28} /> : <Muted>—</Muted>}
        </StatCard>
        <StatCard>
          <Muted $size="0.8rem">{t('home.homePage.guadagni')}</Muted>
          {wallet.data ? <Gain value={wallet.data.totalGain} size={18} /> : <Muted>—</Muted>}
        </StatCard>
        <StatCard>
          <Muted $size="0.8rem">{t('home.homePage.rendimento')}</Muted>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{wallet.data ? formatPct(wallet.data.returnPct) : '—'}</div>
        </StatCard>
      </Stats>
      )}

      {home.isLoading ? (
        <Spinner />
      ) : !hasContent ? (
        <Section>
          <EmptyState icon={<Clapperboard size={34} />} title={t('home.homePage.ilSiparioStaPerAlzarsi')}>{t('home.homePage.nonCiSonoAncoraTitoli')}</EmptyState>
        </Section>
      ) : (
        <>
          {showMovies && (
            <Section data-testid="home-movies">
              <SectionTitle>
                <Clapperboard size={18} />{' '}{withWallet ? t('home.homePage.iTuoiFilm') : t('home.homePage.filmDisponibili')}{' '}<MoreLink to="/app/film">{withWallet ? t('home.homePage.scopriIFilm') : t('home.homePage.vediTutti')}</MoreLink>
              </SectionTitle>
              {movies.length > 0 ? (
                <Grid $min={150} $gap={22}>
                  {movies.map((c) => (
                    <ContentCard key={c.id} item={c} />
                  ))}
                </Grid>
              ) : (
                myMovies.isLoading ? <Spinner /> : (
                  <Card $padding="18px" data-testid="no-movies">
                    <Muted>{t('home.homePage.nessunFilmAcquistato')}</Muted>{' '}
                    <Link to="/app/film" style={{ textDecoration: 'underline' }}>{t('home.homePage.scopriIFilmDisponibili')}</Link>
                  </Card>
                )
              )}
            </Section>
          )}
          {home.data!.tvSeries.length > 0 && (
            <Section>
              <SectionTitle>
                <Tv size={18} />{' '}{t('home.homePage.serieTvDisponibili')}{' '}<MoreLink to="/app/serie">{t('home.homePage.vediTutte')}</MoreLink>
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
                  <Tv size={18} /> <strong>{t('home.homePage.catalogoSerieTv')}</strong>
                </Stack>
              </Card>
            </Link>
          )}
          <Link to="/app/classifiche" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px">
              <Stack $row $gap={10} $align="center">
                <Trophy size={18} /> <strong>{t('home.homePage.classifiche')}</strong>
              </Stack>
            </Card>
          </Link>
          <Link to="/app/premi" style={{ flex: '1 1 200px' }}>
            <Card $padding="16px">
              <Stack $row $gap={10} $align="center">
                <Gift size={18} /> <strong>{t('home.homePage.premiECoppe')}</strong>
              </Stack>
            </Card>
          </Link>
        </Stack>
      </Section>

      {withWallet && (
      <Section>
        <SectionTitle>{t('home.homePage.attivitaRecenti')}{' '}<MoreLink to="/app/movimenti">{t('home.homePage.storico')}</MoreLink>
        </SectionTitle>
        <Card $padding="4px 18px">
          {activity.data?.items.slice(0, 5).map((tr) => {
            const body = (
              <div>
                <div style={{ fontWeight: 600 }}>{LEDGER_LABELS[tr.type] ?? tr.type}</div>
                <Muted $size="0.8rem">
                  {tr.description} · {formatDateTime(tr.createdAt)}
                </Muted>
              </div>
            );
            if (tr.type === 'MOVIE_PURCHASE' && tr.movieId && features?.movies !== false) {
              return (
                <ActivityLink key={tr.id} to={`/app/film/${tr.movieId}`} aria-label={t('home.homePage.ledgerLabelsDescriptionApriLa', { label: LEDGER_LABELS[tr.type], description: tr.description })} data-testid="activity-movie-link">
                  {body}
                  <Stack $row $gap={6} $align="center">
                    <Bc value={tr.amount} signed size={14} />
                    <ChevronRight size={16} aria-hidden />
                  </Stack>
                </ActivityLink>
              );
            }
            return (
              <ActivityRow key={tr.id}>
                {body}
                <Bc value={tr.amount} signed size={14} />
              </ActivityRow>
            );
          })}
          {activity.data && activity.data.items.length === 0 && <Muted style={{ padding: 16 }}>{t('home.homePage.nessunaAttivita')}</Muted>}
        </Card>
      </Section>
      )}
    </>
  );
}
