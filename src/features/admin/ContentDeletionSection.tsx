import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Archive, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent, ContentDeletionPreview, ContentKindPath } from '../../api/types';
import { Modal } from '../../components/Modal';
import { Alert, Bc, Button, Card, Field, Input, Muted, Spinner, Stack } from '../../components/ui';
import { formatDateTime, formatNumber } from '../../components/format';
import { useAuthStore } from '../../store/auth';
import { t, tx } from '../../i18n';

/**
 * Cancellazione DEFINITIVA di un film o di una serie TV (solo Superadmin).
 * Possibile solo se nessuno l'ha riscattato: chi lo possiede riceve indietro quanto ha speso e il
 * titolo viene cancellato dal database. Se qualcuno l'ha riscattato si può solo archiviare.
 */
export function ContentDeletionSection({ kind, item }: { kind: ContentKindPath; item: AdminContent }) {
  const isSuperadmin = useAuthStore((s) => s.user?.role === 'SUPERADMIN');
  const [open, setOpen] = useState(false);
  if (!isSuperadmin) return null;
  return (
    <Card data-testid="content-deletion">
      <h3 style={{ marginBottom: 4 }}>{t('admin.contentDeletion.titolo')}</h3>
      {item.deletedAt && (
        <Alert $tone="warning" data-testid="movie-deleted" style={{ marginBottom: 10 }}>
          {t('admin.contentDeletion.giaCancellato', { date: formatDateTime(item.deletedAt) })}
        </Alert>
      )}
      <Muted $size="0.82rem" style={{ marginBottom: 12 }}>{t('admin.contentDeletion.nota')}</Muted>
      <Button $variant="danger" onClick={() => setOpen(true)} data-testid="content-delete-open">
        <Trash2 size={15} /> {t('admin.contentDeletion.cancella')}
      </Button>
      {open && <DeleteContentModal kind={kind} item={item} onClose={() => setOpen(false)} />}
    </Card>
  );
}

function DeleteContentModal({ kind, item, onClose }: { kind: ContentKindPath; item: AdminContent; onClose: () => void }) {
  const navigate = useNavigate();
  const preview = useQuery({
    queryKey: ['admin', kind, item.id, 'deletion-preview'],
    queryFn: () => api<ContentDeletionPreview>(`/admin/${kind}/${item.id}/deletion-preview`),
    staleTime: 0,
  });
  const [confirm, setConfirm] = useState('');
  const m = useAdminMutation(() => api<{ refunded: number; totalRefunded: number }>(`/admin/${kind}/${item.id}`, { method: 'DELETE', body: { confirm: true } }));
  const p = preview.data;
  const ok = confirm.trim() === item.title.trim();

  return (
    <Modal title={t('admin.contentDeletion.modaleTitolo', { title: item.title })} onClose={onClose}>
      <Stack $gap={12} data-testid="delete-content-modal">
        {preview.isLoading ? (
          <Spinner />
        ) : p && !p.deletable ? (
          <>
            <Alert $tone="error" data-testid="content-not-deletable">{p.reason}</Alert>
            {p.archiveOnly && (
              <Alert $tone="info">
                <Archive size={15} style={{ verticalAlign: '-2px', marginRight: 6 }} aria-hidden />
                {t('admin.contentDeletion.soloArchivio')}
              </Alert>
            )}
          </>
        ) : (
          p && (
            <>
              <Alert $tone="error">{t('admin.contentDeletion.irreversibile')}</Alert>
              <Card $padding="12px 14px">
                {p.holders > 0 ? (
                  <span data-testid="refund-summary">
                    {tx('admin.contentDeletion.rimborsi', { holders: <strong>{formatNumber(p.holders)}</strong>, total: <Bc value={p.totalRefund} size={13} /> })}
                  </span>
                ) : (
                  <span data-testid="refund-summary">{t('admin.contentDeletion.nessunAcquirente')}</span>
                )}
              </Card>
              <Muted $size="0.85rem">{t('admin.contentDeletion.effetti')}</Muted>
              <Field label={t('admin.contentDeletion.conferma', { title: item.title })}>
                <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
              </Field>
            </>
          )
        )}
        {m.error && <Alert $tone="error">{m.error.message}</Alert>}
        <Stack $row $gap={8} $justify="flex-end">
          <Button $variant="secondary" onClick={onClose}>{t('admin.contentDeletion.annulla')}</Button>
          {p?.deletable && (
            <Button
              $variant="danger"
              disabled={!ok || m.isPending}
              onClick={() => m.mutate(undefined, { onSuccess: () => navigate(`/admin/pubblicazione?tipo=${kind}`, { replace: true }) })}
            >
              {m.isPending ? t('admin.contentDeletion.inCorso') : t('admin.contentDeletion.elimina')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
