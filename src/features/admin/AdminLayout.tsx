import { Link, NavLink, Outlet } from 'react-router';
import styled from 'styled-components';
import { ArrowLeft, Eye, FileClock, LayoutDashboard, Users } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { SiteFooter } from '../../components/layout/SiteChrome';
import { Badge } from '../../components/ui';
import { hasPermission, useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';

const Shell = styled.div`
  min-height: 100vh;
`;

const Top = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.brand};
  color: ${({ theme }) => theme.colors.onBrand};
  box-shadow: 0 2px 8px rgba(14, 75, 111, 0.25);
  ${media.md} { padding: 10px 32px; }
  a { color: ${({ theme }) => theme.colors.onBrand}; }
`;

const Nav = styled.nav`
  display: flex;
  gap: 4px;
  overflow-x: auto;
  flex: 1;
`;

const Item = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 500;
  white-space: nowrap;
  &:hover { background: ${({ theme }) => theme.colors.brandDark}; }
  &.active { background: ${({ theme }) => theme.colors.brandDarker}; font-weight: 700; }
`;

const Body = styled.main`
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 16px 60px;
  ${media.md} { padding: 28px 32px 60px; }
`;

/** Navigazione amministrativa distinta da quella utente. Le voci seguono i permessi reali. */
export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const can = (p: string) => hasPermission(user, p);
  const canContent = ['content.create', 'content.edit', 'content.publish', 'content.archive', 'content.purchases'].some(can);

  return (
    <Shell>
      <Top>
        <Link to="/admin" aria-label="Amministrazione"><Logo height={26} tone="light" /></Link>
        <Badge $tone="neutral">{user?.role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'}</Badge>
        <Nav aria-label="Amministrazione">
          {can('dashboard.view') && <Item to="/admin" end><LayoutDashboard size={16} /> Dashboard</Item>}
          {canContent && <Item to="/admin/pubblicazione"><Eye size={16} /> Pubblicazione</Item>}
          {(can('users.view') || user?.role === 'SUPERADMIN') && <Item to="/admin/utenti"><Users size={16} /> Utenti</Item>}
          {can('audit.view') && <Item to="/admin/audit"><FileClock size={16} /> Audit log</Item>}
        </Nav>
        <Link to="/app" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Torna all’app
        </Link>
      </Top>
      <Body>
        <Outlet />
      </Body>
      <SiteFooter />
    </Shell>
  );
}
