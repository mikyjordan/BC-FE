import { Link, NavLink, Outlet } from 'react-router';
import styled from 'styled-components';
import { ArrowLeft, Eye, FileClock, LayoutDashboard, Settings, Users } from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { SiteFooter } from '../../components/layout/SiteChrome';
import { Badge } from '../../components/ui';
import { hasPermission, useAuthStore } from '../../store/auth';
import { media } from '../../theme/theme';
import { t } from '../../i18n';

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  width: 100%;
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
        <Link to="/admin" aria-label={t('admin.adminLayout.amministrazione')}><Logo height={26} tone="light" /></Link>
        <Badge $tone="neutral">{user?.role === 'SUPERADMIN' ? t('admin.adminLayout.superadmin') : t('admin.adminLayout.admin')}</Badge>
        <Nav aria-label={t('admin.adminLayout.amministrazione')}>
          {can('dashboard.view') && <Item to="/admin" end><LayoutDashboard size={16} />{' '}{t('admin.adminLayout.dashboard')}</Item>}
          {canContent && <Item to="/admin/pubblicazione"><Eye size={16} />{' '}{t('admin.adminLayout.pubblicazione')}</Item>}
          {(can('users.view') || user?.role === 'SUPERADMIN') && <Item to="/admin/utenti"><Users size={16} />{' '}{t('admin.adminLayout.utenti')}</Item>}
          {can('audit.view') && <Item to="/admin/audit"><FileClock size={16} />{' '}{t('admin.adminLayout.auditLog')}</Item>}
          {user?.role === 'SUPERADMIN' && <Item to="/admin/impostazioni"><Settings size={16} />{' '}{t('admin.adminLayout.impostazioni')}</Item>}
        </Nav>
        <Link to="/app" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />{' '}{t('admin.adminLayout.tornaAllApp')}</Link>
      </Top>
      <Body>
        <Outlet />
      </Body>
      <SiteFooter />
    </Shell>
  );
}
