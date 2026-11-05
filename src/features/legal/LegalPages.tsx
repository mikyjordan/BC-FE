import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { PublicHeader, SiteFooter } from '../../components/layout/SiteChrome';
import { Alert, Card } from '../../components/ui';
import { t } from '../../i18n';

const Wrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 16px 60px;
  h1 { margin: 24px 0 16px; }
  h2 { margin: 22px 0 8px; }
  p, li { color: ${({ theme }) => theme.colors.textSecondary}; }
  ul { padding-left: 20px; }
`;

function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
    <PublicHeader />
    <Wrap>
      <h1>{title}</h1>
      <Alert $tone="warning" style={{ marginBottom: 18 }}>{t('legal.legalPages.bozzaDaSottoporreAVerifica')}</Alert>
      <Card>{children}</Card>
      <p style={{ marginTop: 16 }}>
        <Link to="/come-funziona" style={{ textDecoration: 'underline' }}>{t('legal.legalPages.comeFunzionaBustercinema')}</Link>
      </p>
    </Wrap>
    <SiteFooter />
    </>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title={t('legal.legalPages.terminiECondizioni')}>
      <h2>{t('legal.legalPages.naturaDelServizio')}</h2>
      <p>{t('legal.legalPages.bustercinemaEUnGiocoDi')}</p>
      <h2>{t('legal.legalPages.bustercoin')}</h2>
      <ul>
        <li>{t('legal.legalPages.bustercoinEUnaValutaVirtuale')}</li>
        <li>{t('legal.legalPages.nonEDenaroNonE')}</li>
        <li>{t('legal.legalPages.lePartecipazioniAcquistateSonoVirtuali')}</li>
      </ul>
      <h2>{t('legal.legalPages.acquistoDeiFilm')}</h2>
      <ul>
        <li>{t('legal.legalPages.ogniFilmPuoEssereAcquistato')}</li>
        <li>{t('legal.legalPages.laPossibilitaDiAcquistareUn')}</li>
        <li>{t('legal.legalPages.ilRiscattoAccreditaLIncasso')}</li>
        <li>{t('legal.legalPages.allUscitaDalleSaleIl')}</li>
      </ul>
      <h2>{t('legal.legalPages.datiSuiContenuti')}</h2>
      <p>{t('legal.legalPages.iRendimentiVirtualiSiBasano')}</p>
      <h2>{t('common.premi')}</h2>
      <p>{t('legal.legalPages.eventualiPremiEVoucherSono')}</p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title={t('legal.legalPages.informativaPrivacy')}>
      <h2>{t('legal.legalPages.datiTrattati')}</h2>
      <ul>
        <li>{t('legal.legalPages.datiDiAccountEmailNome')}</li>
        <li>{t('legal.legalPages.datiDiProfiloFacoltativiNome')}</li>
        <li>{t('legal.legalPages.datiDiGiocoMovimentiBustercoin')}</li>
        <li>{t('legal.legalPages.datiTecniciDiSessioneIndirizzo')}</li>
      </ul>
      <h2>{t('legal.legalPages.cookie')}</h2>
      <p>{t('legal.legalPages.utilizziamoUnSoloCookieTecnico')}</p>
      <h2>{t('legal.legalPages.diritti')}</h2>
      <p>{t('legal.legalPages.puoiChiedereAccessoRettificaO')}</p>
    </LegalLayout>
  );
}
