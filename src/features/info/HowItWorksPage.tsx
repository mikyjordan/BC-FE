import { Link } from 'react-router';
import styled from 'styled-components';
import { CalendarClock, Clapperboard, HandCoins, Ticket, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { CoinIcon } from '../../components/brand/CoinIcon';
import { Alert, Card } from '../../components/ui';
import { PublicHeader, SiteFooter } from '../../components/layout/SiteChrome';
import { useFeatures } from '../../api/hooks';
import { t, tx } from '../../i18n';

const Wrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 16px 60px;
  h1 { margin: 24px 0 8px; }
  p, li { color: ${({ theme }) => theme.colors.textSecondary}; }
  ul { padding-left: 20px; margin: 8px 0 0; }
  li { margin-bottom: 4px; }
`;

const Up = styled.strong`color: ${({ theme }) => theme.colors.successText};`;
const Down = styled.strong`color: ${({ theme }) => theme.colors.dangerText};`;

const Step = styled(Card)`
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 14px;
  margin-top: 14px;
  h2 { font-size: 1.05rem; margin-bottom: 6px; }
  svg { color: ${({ theme }) => theme.colors.brand}; }
`;

function S({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Step as="section">
      {icon}
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    </Step>
  );
}

/** Regole del gioco spiegate agli utenti (pagina pubblica). */
export function HowItWorksPage() {
  // Le regole delle sezioni disattivate dal Superadmin non vengono mostrate.
  const features = useFeatures().data;
  const movies = !!features?.movies;
  const tvSeries = !!features?.tvSeries;
  return (
    <>
    <PublicHeader />
    <Wrap>
      <h1>{t('info.howItWorksPage.comeFunziona')}</h1>
      <p>{t('info.howItWorksPage.bustercinemaEUnGiocoDi')}</p>

      <S icon={<CoinIcon size={30} />} title={t('info.howItWorksPage.iBustercoin')}>
        <p>{t('info.howItWorksPage.allaRegistrazioneRicevi1000')}</p>
      </S>

      {movies && (
      <>
      <S icon={<Ticket size={28} />} title={t('info.howItWorksPage.acquistaUnFilmPrimaChe')}>
        <ul>
          <li>{tx('info.howItWorksPage.ogniFilmSiAcquistaStrong', { strong: <strong>{t('info.howItWorksPage.unaSolaVolta')}</strong> })}</li>
          <li>
            <strong>{t('info.howItWorksPage.laPossibilitaDiAcquistareUn')}</strong>{t('info.howItWorksPage.esempioSeIlFilmEsce')}</li>
          <li>{t('info.howItWorksPage.sullaSchedaDiOgniFilm')}</li>
        </ul>
      </S>

      <S icon={<TrendingUp size={28} />} title={t('info.howItWorksPage.seguiLIncasso')}>
        <p>{tx('info.howItWorksPage.duranteLaProgrammazioneLaPiattaforma', { up: <Up>{t('info.howItWorksPage.verde')}</Up>, down: <Down>{t('info.howItWorksPage.rosso')}</Down> })}</p>
      </S>

      <S icon={<HandCoins size={28} />} title={t('info.howItWorksPage.riscattaQuandoVuoi')}>
        <p>{tx('info.howItWorksPage.conIlPulsanteStrongRicevi', { strong: <strong>{t('info.howItWorksPage.riscatta')}</strong> })}</p>
      </S>

      <S icon={<CalendarClock size={28} />} title={t('info.howItWorksPage.riscattoAutomaticoAllUscitaDalle')}>
        <p>{t('info.howItWorksPage.quandoIlFilmVieneTolto')}</p>
      </S>
      </>
      )}

      {tvSeries && (
        <S icon={<Clapperboard size={28} />} title={t('common.serieTv')}>
          <p>{t('info.howItWorksPage.leSerieTvSiAcquistano')}</p>
        </S>
      )}

      <Alert $tone="info" style={{ marginTop: 18 }}>{tx('info.howItWorksPage.consultaAncheILink', { link: <Link to="/termini" style={{ textDecoration: 'underline' }}>{t('info.howItWorksPage.terminiECondizioni')}</Link> })}</Alert>
    </Wrap>
    <SiteFooter />
    </>
  );
}
