import { Fragment, useState } from 'react';
import styled from 'styled-components';
import { useAuditLogs } from '../../api/hooks';
import type { AuditEntry } from '../../api/types';
import { Badge, Card, Input, Muted, PageHeader, Pagination, Select, Spinner, Stack, Table, TableScroll } from '../../components/ui';
import { formatDateTime } from '../../components/format';
import { t } from '../../i18n';

const Pre = styled.pre`
  margin: 0;
  max-height: 260px;
  overflow: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  background: ${({ theme }) => theme.colors.bgElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-word;
`;

/** Mostra solo i campi effettivamente cambiati tra "prima" e "dopo". */
function diff(entry: AuditEntry) {
  const b = (entry.before ?? {}) as Record<string, unknown>;
  const a = (entry.after ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => k !== 'updatedAt' && JSON.stringify(b[k]) !== JSON.stringify(a[k]));
  return Object.fromEntries(keys.map((k) => [k, entry.before ? { prima: b[k], dopo: a[k] } : a[k]]));
}

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const logs = useAuditLogs(page, { entityType: entityType || undefined, action: action || undefined });

  return (
    <>
      <PageHeader title={t('admin.auditPage.auditLog')} subtitle={t('admin.auditPage.registroImmutabileDelleOperazioniAmministrative')} />
      <Stack $row $gap={10} $wrap style={{ marginBottom: 16 }}>
        <Select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} style={{ maxWidth: 200 }} aria-label={t('admin.auditPage.entita')}>
          <option value="">{t('admin.auditPage.tutteLeEntita')}</option>
          <option value="movie">{t('common.film')}</option>
          <option value="tv_series">{t('common.serieTv')}</option>
          <option value="tv_season">{t('admin.auditPage.stagioni')}</option>
          <option value="user">{t('admin.auditPage.utenti')}</option>
          <option value="wallet_transaction">{t('admin.auditPage.movimenti')}</option>
        </Select>
        <Input placeholder={t('admin.auditPage.azioneEsMoviePublish')} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} style={{ maxWidth: 260 }} aria-label={t('admin.auditPage.azione')} />
      </Stack>
      <Card $padding="6px 10px">
        {logs.isLoading ? <Spinner /> : (
          <TableScroll>
            <Table>
              <thead><tr><th>{t('admin.auditPage.data')}</th><th>{t('admin.auditPage.azione')}</th><th>{t('admin.auditPage.entita')}</th><th>{t('admin.auditPage.attore')}</th><th>{t('admin.auditPage.ip')}</th></tr></thead>
              <tbody>
                {logs.data?.items.map((e) => (
                  <Fragment key={e.id}>
                    <tr onClick={() => setOpen(open === e.id ? null : e.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ whiteSpace: 'nowrap' }}><Muted $size="0.85rem">{formatDateTime(e.createdAt)}</Muted></td>
                      <td><Badge $tone={e.action.includes('publish') ? 'green' : e.action.startsWith('wallet') ? 'gold' : 'blue'}>{e.action}</Badge></td>
                      <td><Muted $size="0.8rem">{e.entityType} · {e.entityId?.slice(0, 8)}</Muted></td>
                      <td><Muted $size="0.8rem">{e.actorRole ?? '—'} {e.actorId ? `· ${e.actorId.slice(0, 8)}` : ''}</Muted></td>
                      <td><Muted $size="0.8rem">{e.ip ?? '—'}</Muted></td>
                    </tr>
                    {open === e.id && (
                      <tr>
                        <td colSpan={5}><Pre>{JSON.stringify(diff(e), null, 2)}</Pre></td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Card>
      {logs.data && <Pagination page={page} totalPages={logs.data.totalPages} onChange={setPage} />}
    </>
  );
}
