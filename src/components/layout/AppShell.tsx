import { NavLink, Outlet, Link, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Award, Clapperboard, Gift, Home, Info, LayoutDashboard, LogOut, Shield, Trophy, Tv, User, Wallet } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Bc } from '../ui';
import { Avatar } from '../Avatar';
import { SiteFooter } from './SiteChrome';
import { useFeatures, useWallet } from '../../api/hooks';
import type { Features } from '../../api/types';
import { logout } from '../../api/client';
import { hasWallet, isStaff, useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';

/* ---------- Header blu a tutta larghezza ---------- */
const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  height: ${({ theme }) => theme.layout.header};
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(14, 75, 111, 0.25);
  ${media.md} { padding: 0 24px; }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BalancePill = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
`;

const HeaderIconLink = styled(Link)`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.onBrand};
  ${media.md} { display: none; }
`;

/* ---------- Corpo: sidebar bianca + contenuto ---------- */
const Body = styled.div`
  ${media.md} {
    display: grid;
    grid-template-columns: ${({ theme }) => theme.layout.sidebar} 1fr;
  }
`;

const Sidebar = styled.aside`
  display: none;
  ${media.md} {
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: sticky;
    top: ${({ theme }) => theme.layout.header};
    height: calc(100vh - ${({ theme }) => theme.layout.header});
    padding: 18px 12px;
    background: ${({ theme }) => theme.colors.surface};
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const SideLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; color: ${({ theme }) => theme.colors.text}; }
  &.active { background: ${({ theme }) => theme.colors.infoSoft}; color: ${({ theme }) => theme.colors.primaryText}; font-weight: 700; }
`;

const Main = styled.main`
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${({ theme }) => theme.layout.header});
  padding-bottom: ${({ theme }) => theme.layout.bottomNav};
  ${media.md} { padding-bottom: 0; }
`;

const Content = styled.div`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.maxContent};
  margin: 0 auto;
  padding: 22px 16px 40px;
  ${media.md} { padding: 28px 32px 48px; }
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 10px 4px;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; color: ${({ theme }) => theme.colors.text}; }
`;

/* ---------- Footer di navigazione mobile (blu) ---------- */
const BottomNav = styled.nav`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  height: ${({ theme }) => theme.layout.bottomNav};
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: ${({ theme }) => theme.colors.brand};
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2px 8px rgba(14, 75, 111, 0.25);
  ${media.md} { display: none; }
`;

const BottomLink = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.onBrandMuted};
  &.active { color: ${({ theme }) => theme.colors.onBrand}; font-weight: 700; background: ${({ theme }) => theme.colors.brandDarker}; }
`;

type NavItem = { to: string; label: string; icon: typeof Home; end?: boolean; feature?: keyof Features; wallet?: boolean };
const nav: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/film', label: 'Film', icon: Clapperboard, feature: 'movies' },
  { to: '/app/serie', label: 'Serie TV', icon: Tv, feature: 'tvSeries' },
  { to: '/app/portafoglio', label: 'Portafoglio', icon: Wallet, wallet: true },
  { to: '/app/classifiche', label: 'Classifiche', icon: Trophy },
  { to: '/app/premi', label: 'Premi', icon: Gift },
  { to: '/app/coppe', label: 'Coppe', icon: Award },
  { to: '/app/profilo', label: 'Profilo', icon: User },
];

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const wallet = useWallet();
  const features = useFeatures().data;
  const navigate = useNavigate();
  // Voci Film e Serie TV solo se le sezioni sono abilitate dal Superadmin.
  const withWallet = hasWallet(user);
  const visibleNav = nav.filter((n) => (!n.feature || !!features?.[n.feature]) && (!n.wallet || withWallet));
  const catalogTab = features?.movies
    ? { to: '/app/film', label: 'Film', icon: Clapperboard }
    : features?.tvSeries
      ? { to: '/app/serie', label: 'Serie TV', icon: Tv }
      : null;
  const bottomTabs: NavItem[] = [
    { to: '/app', label: 'Home', icon: Home, end: true },
    ...(catalogTab ? [catalogTab] : []),
    ...(withWallet ? [{ to: '/app/portafoglio', label: 'Portafoglio', icon: Wallet }] : []),
    { to: '/app/classifiche', label: 'Classifiche', icon: Trophy },
    { to: '/app/profilo', label: 'Profilo', icon: User },
  ];

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <Header>
        <Link to="/app" aria-label="BusterCinema, home">
          <Logo height={28} tone="light" />
        </Link>
        <HeaderRight>
          {wallet.data && (
            <BalancePill to="/app/portafoglio" aria-label="Saldo Bustercoin">
              <Bc value={wallet.data.balance} size={14} />
            </BalancePill>
          )}
          {isStaff(user) && (
            <HeaderIconLink to="/admin" aria-label="Amministrazione">
              <LayoutDashboard size={22} />
            </HeaderIconLink>
          )}
          <Link to="/app/profilo" aria-label="Profilo">
            <Avatar user={user} size={34} />
          </Link>
        </HeaderRight>
      </Header>

      <Body>
        <Sidebar aria-label="Navigazione principale">
          {visibleNav.map(({ to, label, icon: Icon, end }) => (
            <SideLink key={to} to={to} end={end}>
              <Icon size={18} aria-hidden /> {label}
            </SideLink>
          ))}
          <SideLink to="/come-funziona">
            <Info size={18} aria-hidden /> Come funziona
          </SideLink>
          {isStaff(user) && (
            <>
              <Divider />
              <SideLink to="/admin">
                <Shield size={18} aria-hidden /> Amministrazione
              </SideLink>
            </>
          )}
          <div style={{ flex: 1 }} />
          <LogoutButton onClick={onLogout}>
            <LogOut size={18} aria-hidden /> Esci
          </LogoutButton>
        </Sidebar>

        <Main>
          <Content>
            <Outlet />
          </Content>
          <SiteFooter />
        </Main>
      </Body>

      <BottomNav aria-label="Navigazione" style={{ gridTemplateColumns: `repeat(${bottomTabs.length}, 1fr)` }}>
        {bottomTabs.map(({ to, label, icon: Icon, end }) => (
          <BottomLink key={to} to={to} end={end}>
            <Icon size={20} aria-hidden /> {label}
          </BottomLink>
        ))}
      </BottomNav>
    </>
  );
}
