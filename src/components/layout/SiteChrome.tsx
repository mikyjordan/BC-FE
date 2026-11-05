import { Link } from 'react-router';
import styled from 'styled-components';
import { Logo } from '../brand/Logo';
import { useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';
import { t } from '../../i18n';

/** Header blu delle pagine pubbliche (Come funziona, Termini, Privacy). */
const HeaderBar = styled.header`
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
  height: ${({ theme }) => theme.layout.header};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  ${media.md} { padding: 0 32px; }
  a { color: ${({ theme }) => theme.colors.onBrand}; font-weight: 600; font-size: 0.9rem; }
`;

export function PublicHeader() {
  const authed = useAuthStore((s) => s.status === 'authenticated');
  return (
    <HeaderBar>
      <Link to={authed ? '/app' : '/login'} aria-label={t('components.siteChrome.bustercinemaHome')}>
        <Logo height={28} tone="light" />
      </Link>
      <Link to={authed ? '/app' : '/login'}>{authed ? t('components.siteChrome.tornaAllApp') : t('components.siteChrome.accedi')}</Link>
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
