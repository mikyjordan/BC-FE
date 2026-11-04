import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { Logo } from '../../components/brand/Logo';
import { CoinIcon } from '../../components/brand/CoinIcon';
import { Card, Muted } from '../../components/ui';
import { media } from '../../theme/theme';

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
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    background:
      radial-gradient(600px 300px at 20% 30%, rgba(79,107,216,0.25), transparent 70%),
      repeating-linear-gradient(0deg, transparent 0 36px, rgba(255,255,255,0.02) 36px 38px),
      ${({ theme }) => theme.colors.bgElevated};
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

const MobileLogo = styled.div`
  margin-bottom: 18px;
  ${media.md} { display: none; }
`;

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Page>
      <Showcase>
        <Logo height={40} />
        <div>
          <Headline>Investi virtualmente nei film e nelle serie che fanno parlare l’Italia.</Headline>
          <Muted style={{ marginTop: 16, maxWidth: 440, display: 'flex', gap: 10, alignItems: 'center' }}>
            <CoinIcon size={28} /> Ogni nuovo giocatore riceve 1.000.000 di Bustercoin di benvenuto.
          </Muted>
        </div>
        <Muted $size="0.8rem">
          Bustercoin è una valuta virtuale di gioco: non è denaro, non è convertibile e non attribuisce diritti reali sui contenuti.
        </Muted>
      </Showcase>
      <FormSide>
        <Box>
          <div style={{ marginBottom: 22 }}>
            <MobileLogo>
              <Link to="/">
                <Logo height={30} />
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
  color: ${({ theme }) => theme.colors.primaryHover};
  font-weight: 600;
  &:hover { text-decoration: underline; }
`;
