import { Link } from 'react-router';
import styled from 'styled-components';
import { Logo } from '../brand/Logo';
import { useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';
import { t } from '../../i18n';

/** Header delle pagine pubbliche (pagina iniziale, Come funziona, Termini, Privacy). */
const HeaderBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(100deg, ${({ theme }) => theme.colors.brand} 55%, ${({ theme }) => theme.colors.brandAccent});
  box-shadow: 0 2px 10px ${({ theme }) => theme.colors.brandShadow};
  color: ${({ theme }) => theme.colors.onBrand};
  height: ${({ theme }) => theme.layout.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  ${media.md} { padding: 0 32px; }
  a { color: ${({ theme }) => theme.colors.onBrand}; font-weight: 600; font-size: 0.9rem; }
  nav { display: flex; align-items: center; gap: 16px; }
`;

const RegisterLink = styled(Link)`
  && {
    background: ${({ theme }) => theme.colors.action};
    color: ${({ theme }) => theme.colors.onAction};
    padding: 7px 14px;
    border-radius: ${({ theme }) => theme.radii.pill};
    font-weight: 800;
  }
`;

const HideOnMobile = styled(Link)`
  ${media.mobile} { display: none; }
`;

export function PublicHeader() {
  const authed = useAuthStore((s) => s.status === 'authenticated');
  return (
    <HeaderBar>
      <Link to={authed ? '/app' : '/'} aria-label={t('components.siteChrome.bustercinemaHome')}>
        <Logo height={28} tone="light" />
      </Link>
      {authed ? (
        <Link to="/app">{t('components.siteChrome.tornaAllApp')}</Link>
      ) : (
        <nav>
          <HideOnMobile to="/come-funziona">{t('components.siteChrome.comeFunziona')}</HideOnMobile>
          <Link to="/login">{t('components.siteChrome.accedi')}</Link>
          <RegisterLink to="/registrazione">{t('components.siteChrome.registrati')}</RegisterLink>
        </nav>
      )}
    </HeaderBar>
  );
}

const FooterBar = styled.footer`
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
  padding: 22px 16px;
  ${media.md} { padding: 22px 32px; }
  font-size: 0.82rem;
  nav { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-bottom: 8px; }
  a { color: ${({ theme }) => theme.colors.onBrand}; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  p { color: ${({ theme }) => theme.colors.onBrandMuted}; }
`;

/** Footer blu comune a tutte le pagine. */
export function SiteFooter() {
  return (
    <FooterBar>
      <nav aria-label={t('components.siteChrome.informazioni')}>
        <Link to="/come-funziona">{t('components.siteChrome.comeFunziona')}</Link>
        <Link to="/termini">{t('components.siteChrome.terminiECondizioni')}</Link>
        <Link to="/privacy">{t('components.siteChrome.privacy')}</Link>
      </nav>
      <p>{t('components.siteChrome.bustercoinEUnaValutaVirtuale')}</p>
    </FooterBar>
  );
}
