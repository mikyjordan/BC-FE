import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { Logo } from '../../components/brand/Logo';
import { CoinIcon } from '../../components/brand/CoinIcon';
import { Card, Muted } from '../../components/ui';
import { media } from '../../theme/theme';
import { t } from '../../i18n';

const Page = styled.div`
  min-height: 100vh;
  display: grid;
  ${media.md} { grid-template-columns: 1.1fr 1fr; }
`;

const Showcase = styled.div`
  display: none;
  ${media.md} {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    background: ${({ theme }) => theme.colors.brand};
    color: ${({ theme }) => theme.colors.onBrand};
    a { color: ${({ theme }) => theme.colors.onBrand}; }
  }
`;

const Headline = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 2.4rem;
  max-width: 460px;
  line-height: 1.15;
`;

const FormSide = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
`;

const Box = styled(Card)`
  width: 100%;
  max-width: 420px;
  padding: 28px;
`;

const OnBrandText = styled.p`
  color: ${({ theme }) => theme.colors.onBrandMuted};
`;

const MobileLogo = styled.div`
  margin-bottom: 18px;
  ${media.md} { display: none; }
`;

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Page>
      <Showcase>
        <Logo height={40} tone="light" />
        <div>
          <Headline>{t('auth.authLayout.investiVirtualmenteNeiFilmE')}</Headline>
          <OnBrandText style={{ marginTop: 16, maxWidth: 440, display: 'flex', gap: 10, alignItems: 'center' }}>
            <CoinIcon size={28} />{' '}{t('auth.authLayout.ogniNuovoGiocatoreRiceve1')}</OnBrandText>
        </div>
        <OnBrandText style={{ fontSize: '0.8rem' }}>{t('auth.authLayout.bustercoinEUnaValutaVirtuale')}{' '}
          <Link to="/come-funziona" style={{ textDecoration: 'underline', fontWeight: 600 }}>{t('auth.authLayout.comeFunziona')}</Link>
        </OnBrandText>
      </Showcase>
      <FormSide>
        <Box>
          <div style={{ marginBottom: 22 }}>
            <MobileLogo>
              <Link to="/">
                <Logo height={30} tone="brand" />
              </Link>
            </MobileLogo>
            <h1 style={{ fontSize: '1.6rem' }}>{title}</h1>
            {subtitle && <Muted style={{ marginTop: 6 }}>{subtitle}</Muted>}
          </div>
          {children}
          {footer && <div style={{ marginTop: 20, textAlign: 'center' }}>{footer}</div>}
        </Box>
      </FormSide>
    </Page>
  );
}

export const TextLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primaryText};
  font-weight: 600;
  &:hover { text-decoration: underline; }
`;
