import { Link, Navigate } from 'react-router';
import styled from 'styled-components';
import { useAdminDashboard, useReconciliation } from '../../api/hooks';
import { Alert, Bc, Button, Card, Grid, Muted, PageHeader, Spinner, Stack } from '../../components/ui';
import { formatDateTime, formatNumber, STATUS_LABELS } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import type { PublicationStatus } from '../../api/types';

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
  if (!dash.data) return <Alert $tone="error">Impossibile caricare la dashboard.</Alert>;
  const d = dash.data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Stato della piattaforma" />
      <Grid $min={210} $gap={14}>
        <Card>
          <Muted $size="0.8rem">Utenti registrati</Muted>
          <Big>{formatNumber(d.users.total)}</Big>
          <Muted $size="0.8rem">+{d.users.last7Days} negli ultimi 7 giorni · {d.users.admins} admin</Muted>
        </Card>
        <Card>
          <Muted $size="0.8rem">Bustercoin in circolazione</Muted>
          <Bc value={d.economy.totalBalance} size={20} />
          <Muted $size="0.8rem">{formatNumber(d.economy.wallets)} wallet</Muted>
        </Card>
        <Card>
          <Muted $size="0.8rem">Ultime 24 ore</Muted>
          <Big>{formatNumber(d.last24h.transactions)}</Big>
          <Muted $size="0.8rem">movimenti · {d.last24h.purchases} acquisti</Muted>
        </Card>
      </Grid>

      <Grid $min={300} $gap={14} style={{ marginTop: 14 }}>
        {(['movies', 'tvSeries'] as const).map((k) => (
          <Card key={k}>
            <Stack $row $justify="space-between" $align="center" style={{ marginBottom: 12 }}>
              <h3>{k === 'movies' ? 'Film' : 'Serie TV'}</h3>
              <Link to={`/admin/pubblicazione?tipo=${k === 'movies' ? 'movies' : 'tv-series'}`}>
                <Button $size="sm" $variant="secondary">Gestisci</Button>
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
              <h3>Riconciliazione wallet / ledger</h3>
              <Muted $size="0.85rem">Verifica che ogni saldo coincida con la somma dei movimenti registrati.</Muted>
            </div>
            <Button $variant="secondary" onClick={() => recon.refetch()} disabled={recon.isFetching}>
              {recon.isFetching ? 'Verifica…' : 'Esegui verifica'}
            </Button>
          </Stack>
          {recon.data && (
            <Alert $tone={recon.data.mismatches === 0 ? 'success' : 'error'} style={{ marginTop: 14 }}>
              {recon.data.mismatches === 0
                ? `Tutti i wallet sono coerenti con il ledger (${formatDateTime(recon.data.checkedAt)}).`
                : `${recon.data.mismatches} wallet incoerenti: verificare immediatamente.`}
            </Alert>
          )}
        </Card>
      )}
    </>
  );
}
