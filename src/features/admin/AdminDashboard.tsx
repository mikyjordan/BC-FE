import { Link, Navigate } from 'react-router';
import styled from 'styled-components';
import { useAdminDashboard, useReconciliation } from '../../api/hooks';
import { Alert, Bc, Button, Card, Grid, Muted, PageHeader, Spinner, Stack } from '../../components/ui';
import { formatDateTime, formatNumber, STATUS_LABELS } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import type { PublicationStatus } from '../../api/types';
import { t, tx } from '../../i18n';

const Big = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

const STATUSES: PublicationStatus[] = ['DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED'];

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const canView = hasPermission(user, 'dashboard.view');
  const dash = useAdminDashboard();
  const recon = useReconciliation();

  if (!canView) return <Navigate to="/admin/pubblicazione" replace />;
  if (dash.isLoading) return <Spinner />;
  if (!dash.data) return <Alert $tone="error">{t('admin.adminDashboard.impossibileCaricareLaDashboard')}</Alert>;
  const d = dash.data;

  return (
    <>
      <PageHeader title={t('admin.adminDashboard.dashboard')} subtitle={t('admin.adminDashboard.statoDellaPiattaforma')} />
      <Grid $min={210} $gap={14}>
        <Card>
          <Muted $size="0.8rem">{t('admin.adminDashboard.utentiRegistrati')}</Muted>
          <Big>{formatNumber(d.users.total)}</Big>
          <Muted $size="0.8rem">{tx('admin.adminDashboard.last7daysNegliUltimi7Giorni', { last7Days: d.users.last7Days, admins: d.users.admins })}</Muted>
        </Card>
        <Card>
          <Muted $size="0.8rem">{t('admin.adminDashboard.bustercoinInCircolazione')}</Muted>
          <Bc value={d.economy.totalBalance} size={20} />
          <Muted $size="0.8rem">{tx('admin.adminDashboard.walletsWallet', { wallets: formatNumber(d.economy.wallets) })}</Muted>
        </Card>
        <Card>
          <Muted $size="0.8rem">{t('admin.adminDashboard.ultime24Ore')}</Muted>
          <Big>{formatNumber(d.last24h.transactions)}</Big>
          <Muted $size="0.8rem">{tx('admin.adminDashboard.movimentiPurchasesAcquisti', { purchases: d.last24h.purchases })}</Muted>
        </Card>
      </Grid>

      <Grid $min={300} $gap={14} style={{ marginTop: 14 }}>
        {(['movies', 'tvSeries'] as const).map((k) => (
          <Card key={k}>
            <Stack $row $justify="space-between" $align="center" style={{ marginBottom: 12 }}>
              <h3>{k === 'movies' ? t('common.film') : t('common.serieTv')}</h3>
              <Link to={`/admin/pubblicazione?tipo=${k === 'movies' ? 'movies' : 'tv-series'}`}>
                <Button $size="sm" $variant="secondary">{t('admin.adminDashboard.gestisci')}</Button>
              </Link>
            </Stack>
            <Grid $min={110} $gap={10}>
              {STATUSES.map((s) => (
                <div key={s}>
                  <Muted $size="0.78rem">{STATUS_LABELS[s]}</Muted>
                  <Big style={{ fontSize: '1.3rem' }}>{d.content[k][s]}</Big>
                </div>
              ))}
            </Grid>
          </Card>
        ))}
      </Grid>

      {hasPermission(user, 'wallet.view') && (
        <Card style={{ marginTop: 14 }}>
          <Stack $row $justify="space-between" $align="center" $wrap $gap={10}>
            <div>
              <h3>{t('admin.adminDashboard.riconciliazioneWalletLedger')}</h3>
              <Muted $size="0.85rem">{t('admin.adminDashboard.verificaCheOgniSaldoCoincida')}</Muted>
            </div>
            <Button $variant="secondary" onClick={() => recon.refetch()} disabled={recon.isFetching}>
              {recon.isFetching ? t('admin.adminDashboard.verifica') : t('admin.adminDashboard.eseguiVerifica')}
            </Button>
          </Stack>
          {recon.data && (
            <Alert $tone={recon.data.mismatches === 0 ? 'success' : 'error'} style={{ marginTop: 14 }}>
              {recon.data.mismatches === 0
                ? t('admin.adminDashboard.tuttiIWalletSonoCoerenti', { checkedAt: formatDateTime(recon.data.checkedAt) })
                : t('admin.adminDashboard.mismatchesWalletIncoerentiVerificareImmediatamente', { mismatches: recon.data.mismatches })}
            </Alert>
          )}
        </Card>
      )}
    </>
  );
}
