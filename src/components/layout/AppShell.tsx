import { NavLink, Outlet, Link, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Award, Clapperboard, Info, Gift, Home, LayoutDashboard, LogOut, Shield, Trophy, Tv, User, Wallet } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Bc } from '../ui';
import { Avatar } from '../Avatar';
import { useWallet } from '../../api/hooks';
import { logout } from '../../api/client';
import { isStaff, useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';

const Shell = styled.div`
  min-height: 100vh;
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
    gap: 6px;
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 22px 14px;
    background: rgba(10, 16, 34, 0.85);
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    backdrop-filter: blur(8px);
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
  &.active { background: ${({ theme }) => theme.colors.primarySoft}; color: ${({ theme }) => theme.colors.text}; }
  &.active svg { color: ${({ theme }) => theme.colors.primaryHover}; }
`;

const Main = styled.main`
  min-width: 0;
  padding: 0 16px calc(${({ theme }) => theme.layout.bottomNav} + 28px);
  ${media.md} { padding: 0 32px 48px; }
`;

const Content = styled.div`
  max-width: ${({ theme }) => theme.layout.maxContent};
  margin: 0 auto;
`;

const Topbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin: 0 -16px;
  background: rgba(6, 10, 22, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  ${media.md} { padding: 12px 32px; margin: 0 -32px; }
`;

const BalancePill = styled(Link)`
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid rgba(226, 185, 75, 0.35);
`;

const MobileOnly = styled.div`${media.md} { display: none; }`;
const DesktopSpacer = styled.div`display: none; ${media.md} { display: block; }`;

const BottomNav = styled.nav`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 20;
  height: ${({ theme }) => theme.layout.bottomNav};
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: rgba(10, 16, 34, 0.96);
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: env(safe-area-inset-bottom);
  ${media.md} { display: none; }
`;

const BottomLink = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.textMuted};
  &.active { color: ${({ theme }) => theme.colors.text}; }
  &.active svg { color: ${({ theme }) => theme.colors.primaryHover}; }
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

const nav = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/film', label: 'Film', icon: Clapperboard },
  { to: '/app/serie', label: 'Serie TV', icon: Tv },
  { to: '/app/portafoglio', label: 'Portafoglio', icon: Wallet },
  { to: '/app/classifiche', label: 'Classifiche', icon: Trophy },
  { to: '/app/premi', label: 'Premi', icon: Gift },
  { to: '/app/profilo', label: 'Profilo', icon: User },
];

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const wallet = useWallet();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Shell>
      <Sidebar aria-label="Navigazione principale">
        <Link to="/app" style={{ padding: '4px 8px 18px' }}>
          <Logo height={30} />
        </Link>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <SideLink key={to} to={to} end={end}>
            <Icon size={18} /> {label}
          </SideLink>
        ))}
        <SideLink to="/app/coppe">
          <Award size={18} /> Coppe
        </SideLink>
        <SideLink to="/come-funziona">
          <Info size={18} /> Come funziona
        </SideLink>
        {isStaff(user) && (
          <>
            <Divider />
            <SideLink to="/admin">
              <Shield size={18} /> Amministrazione
            </SideLink>
          </>
        )}
        <div style={{ flex: 1 }} />
        <LogoutButton onClick={onLogout}>
          <LogOut size={18} /> Esci
        </LogoutButton>
      </Sidebar>

      <Main>
        <Content>
          <Topbar>
            <MobileOnly>
              <Link to="/app" aria-label="Home">
                <Logo height={26} />
              </Link>
            </MobileOnly>
            <DesktopSpacer />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {wallet.data && (
                <BalancePill to="/app/portafoglio" aria-label="Saldo Bustercoin">
                  <Bc value={wallet.data.balance} size={14} />
                </BalancePill>
              )}
              {isStaff(user) && (
                <MobileOnly>
                  <Link to="/admin" aria-label="Amministrazione">
                    <LayoutDashboard size={22} />
                  </Link>
                </MobileOnly>
              )}
              <Link to="/app/profilo" aria-label="Profilo">
                <Avatar user={user} size={34} />
              </Link>
            </div>
          </Topbar>
          <Outlet />
        </Content>
      </Main>

      <BottomNav aria-label="Navigazione">
        <BottomLink to="/app" end>
          <Home size={20} /> Home
        </BottomLink>
        <BottomLink to="/app/film">
          <Clapperboard size={20} /> Film
        </BottomLink>
        <BottomLink to="/app/portafoglio">
          <Wallet size={20} /> Portafoglio
        </BottomLink>
        <BottomLink to="/app/classifiche">
          <Trophy size={20} /> Classifiche
        </BottomLink>
        <BottomLink to="/app/profilo">
          <User size={20} /> Profilo
        </BottomLink>
      </BottomNav>
    </Shell>
  );
}
