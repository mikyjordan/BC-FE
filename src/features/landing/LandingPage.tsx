import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router';
import styled from 'styled-components';
import { Clapperboard, HandCoins, Lock, Ticket, Trophy, TrendingUp, Tv, Wallet } from 'lucide-react';
import { CoinIcon } from '../../components/brand/CoinIcon';
import { PublicHeader, SiteFooter } from '../../components/layout/SiteChrome';
import { Poster } from '../../components/Poster';
import { Badge, Spinner } from '../../components/ui';
import { formatDateTime, formatNumber } from '../../components/format';
import { useFeatures, useHome } from '../../api/hooks';
import type { PublicContent } from '../../api/types';
import { useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';
import { t } from '../../i18n';
import { useBonusAmounts } from '../info/bonusTexts';

/* ---------- Hero ---------- */
const Hero = styled.section`
  background:
    radial-gradient(circle at 85% 15%, ${({ theme }) => theme.colors.brandAccent} 0, transparent 45%),
    linear-gradient(135deg, ${({ theme }) => theme.colors.brandDarker}, ${({ theme }) => theme.colors.brand});
  color: ${({ theme }) => theme.colors.onBrand};
  padding: 48px 16px 56px;
  ${media.md} { padding: 72px 32px 80px; }
`;

const HeroInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxContent};
  margin: 0 auto;
  display: grid;
  gap: 32px;
  align-items: center;
  ${media.md} { grid-template-columns: 1.4fr 1fr; }
  h1 { font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.08; margin: 10px 0 16px; }
  p { color: ${({ theme }) => theme.colors.onBrandMuted}; font-size: 1.08rem; max-width: 620px; }
`;

const Eyebrow = styled.span`
  display: inline-block;
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tabIndicator};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Ctas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 26px 0 14px;
`;

const Cta = styled(Link)<{ $tone?: 'action' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 22px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 800;
  font-size: 1rem;
  transition: transform 0.12s, background 0.15s;
  ${({ $tone = 'action', theme }) =>
    $tone === 'action'
      ? `background: ${theme.colors.action}; color: ${theme.colors.onAction}; box-shadow: 0 6px 22px ${theme.colors.actionGlow};`
      : `background: transparent; color: ${theme.colors.onBrand}; border: 2px solid ${theme.colors.onBrandMuted};`}
  &:hover { transform: translateY(-2px); }
`;

const Small = styled.small`
  display: block;
  color: ${({ theme }) => theme.colors.onBrandMuted};
  opacity: 0.9;
`;

const CoinStage = styled.div`
  display: none;
  ${media.md} { display: grid; place-items: center; }
  svg { filter: drop-shadow(0 22px 40px ${({ theme }) => theme.colors.brandShadow}); animation: bc-float 4s ease-in-out infinite; }
  @keyframes bc-float { 50% { transform: translateY(-14px) rotate(-6deg); } }
`;

/* ---------- Sezioni ---------- */
const Section = styled.section`
  max-width: ${({ theme }) => theme.layout.maxContent};
  margin: 0 auto;
  padding: 48px 16px 8px;
  ${media.md} { padding: 64px 32px 8px; }
  > h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); margin-bottom: 6px; }
  > p { color: ${({ theme }) => theme.colors.textSecondary}; margin-bottom: 24px; }
`;

const Features = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
`;

const FeatureCard = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadow.card};
  padding: 20px;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-3px); box-shadow: ${({ theme }) => theme.shadow.raised}; }
  h3 { margin: 12px 0 6px; font-size: 1.08rem; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  p { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 0.93rem; }
`;

const IconBubble = styled.span`
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.brand}, ${({ theme }) => theme.colors.brandAccent});
  color: ${({ theme }) => theme.colors.onBrand};
`;

const Steps = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  counter-reset: step;
  li {
    counter-increment: step;
    position: relative;
    background: ${({ theme }) => theme.colors.surfaceAlt};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: 20px 18px 18px 64px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  li::before {
    content: counter(step);
    position: absolute;
    left: 16px;
    top: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 800;
    background: ${({ theme }) => theme.colors.action};
    color: ${({ theme }) => theme.colors.onAction};
  }
`;

const Showcase = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
`;

const ShowItem = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text};
  strong { font-size: 0.92rem; line-height: 1.25; }
  small { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.78rem; }
`;

const Locked = styled.div`
  position: relative;
  > span {
    position: absolute;
    inset: auto 8px 8px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 8px;
    border-radius: ${({ theme }) => theme.radii.pill};
    background: ${({ theme }) => theme.colors.overlay};
    color: ${({ theme }) => theme.colors.onBrand};
    font-size: 0.75rem;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.15s;
  }
  ${ShowItem}:hover & > span, ${ShowItem}:focus-visible & > span { opacity: 1; }
`;

const FinalCta = styled.section`
  max-width: ${({ theme }) => theme.layout.maxContent};
  margin: 56px auto 56px;
  padding: 0 16px;
  ${media.md} { padding: 0 32px; }
  > div {
    border-radius: 24px;
    padding: 36px 24px;
    text-align: center;
    color: ${({ theme }) => theme.colors.onBrand};
    background: linear-gradient(120deg, ${({ theme }) => theme.colors.brand}, ${({ theme }) => theme.colors.brandAccent});
    box-shadow: ${({ theme }) => theme.shadow.raised};
  }
  h2 { font-size: clamp(1.4rem, 3vw, 2rem); margin-bottom: 6px; }
  p { color: ${({ theme }) => theme.colors.onBrandMuted}; }
  ${Ctas} { justify-content: center; margin-bottom: 0; }
`;

function Feature({ icon, title, badge, children }: { icon: ReactNode; title: string; badge?: string; children: ReactNode }) {
  return (
    <FeatureCard>
      <IconBubble aria-hidden>{icon}</IconBubble>
      <h3>
        {title} {badge && <Badge $tone="neutral">{badge}</Badge>}
      </h3>
      {children}
    </FeatureCard>
  );
}

function ShowcaseItem({ item }: { item: PublicContent }) {
  const closes = item.purchase.purchasable ? item.purchase.closesAt : null;
  return (
    <ShowItem to="/registrazione" data-testid="landing-showcase-item">
      <Locked>
        <Poster src={item.posterUrl} alt={item.title} kind={item.kind} />
        <span>
          <Lock size={13} aria-hidden /> {t('landing.registratiPerAcquistare')}
        </span>
      </Locked>
      <strong>{item.title}</strong>
      {item.purchase.priceBc != null && <small>{t('landing.prezzo', { price: formatNumber(item.purchase.priceBc) })}</small>}
      {closes && <small>{t('landing.acquistabileFino', { date: formatDateTime(closes) })}</small>}
    </ShowItem>
  );
}

/**
 * Pagina iniziale pubblica: spiega cosa si può fare su BusterCinema (senza poterlo fare).
 * Chi ha già una sessione va direttamente nell'app.
 */
export function LandingPage() {
  const status = useAuthStore((s) => s.status);
  const b = useBonusAmounts();
  const features = useFeatures().data;
  const home = useHome();
  if (status === 'loading') return <Spinner />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;

  const movies = !!features?.movies;
  const tvSeries = !!features?.tvSeries;
  const showcase = [...(home.data?.movies ?? []), ...(home.data?.tvSeries ?? [])].slice(0, 8);

  return (
    <>
      <PublicHeader />
      <main>
        <Hero>
          <HeroInner>
            <div>
              <Eyebrow>{t('landing.eyebrow')}</Eyebrow>
              <h1>{t('landing.titolo')}</h1>
              <p>{t('landing.sottotitolo', { bonus: b.bonus })}</p>
              <Ctas>
                <Cta to="/registrazione" data-testid="landing-register">{t('landing.registrati')}</Cta>
                <Cta to="/login" $tone="ghost">{t('landing.accedi')}</Cta>
              </Ctas>
              <Small>{t('landing.nonSoldiVeri')}</Small>
            </div>
            <CoinStage aria-hidden>
              <CoinIcon size={220} />
            </CoinStage>
          </HeroInner>
        </Hero>

        <Section aria-labelledby="landing-features">
          <h2 id="landing-features">{t('landing.cosaPuoiFare')}</h2>
          <p>{t('landing.cosaPuoiFareSotto')}</p>
          <Features data-testid="landing-features">
            <Feature icon={<CoinIcon size={30} />} title={t('landing.f.bonusTitolo')}>
              <p>{t('landing.f.bonus', { bonus: b.bonus })}</p>
              {b.hasWeekly && <p>{t('landing.f.bonusSettimanale', { weekly: b.weekly })}</p>}
            </Feature>
            {movies && (
              <>
                <Feature icon={<Ticket size={26} />} title={t('landing.f.compraTitolo')}>
                  <p>{t('landing.f.compra')}</p>
                </Feature>
                <Feature icon={<TrendingUp size={26} />} title={t('landing.f.incassiTitolo')}>
                  <p>{t('landing.f.incassi')}</p>
                </Feature>
                <Feature icon={<HandCoins size={26} />} title={t('landing.f.riscattaTitolo')}>
                  <p>{t('landing.f.riscatta')}</p>
                </Feature>
              </>
            )}
            {tvSeries && (
              <Feature icon={<Tv size={26} />} title={t('landing.f.serieTitolo')}>
                <p>{t('landing.f.serie')}</p>
              </Feature>
            )}
            <Feature icon={<Wallet size={26} />} title={t('landing.f.portafoglioTitolo')}>
              <p>{t('landing.f.portafoglio')}</p>
            </Feature>
            <Feature icon={<Trophy size={26} />} title={t('landing.f.prestoTitolo')} badge={t('landing.presto')}>
              <p>{t('landing.f.presto')}</p>
            </Feature>
          </Features>
        </Section>

        <Section aria-labelledby="landing-steps">
          <h2 id="landing-steps">{t('landing.comeSiGioca')}</h2>
          <p>
            <Link to="/come-funziona" style={{ textDecoration: 'underline', fontWeight: 600 }}>{t('landing.regole')}</Link>
          </p>
          <Steps>
            <li>{t('landing.s1')}</li>
            <li>{t('landing.s2')}</li>
            <li>{t('landing.s3')}</li>
            <li>{t('landing.s4')}</li>
          </Steps>
        </Section>

        {showcase.length > 0 && (
          <Section aria-labelledby="landing-showcase">
            <h2 id="landing-showcase">
              <Clapperboard size={24} aria-hidden style={{ verticalAlign: '-3px', marginRight: 8 }} />
              {t('landing.vetrina')}
            </h2>
            <p>{t('landing.vetrinaSotto')}</p>
            <Showcase data-testid="landing-showcase">
              {showcase.map((item) => <ShowcaseItem key={`${item.kind}-${item.id}`} item={item} />)}
            </Showcase>
          </Section>
        )}

        <FinalCta>
          <div>
            <h2>{t('landing.ctaTitolo')}</h2>
            <p>{t('landing.ctaSotto')}</p>
            <Ctas>
              <Cta to="/registrazione">{t('landing.registrati')}</Cta>
              <Cta to="/login" $tone="ghost">{t('landing.accedi')}</Cta>
            </Ctas>
          </div>
        </FinalCta>
      </main>
      <SiteFooter />
    </>
  );
}
