import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent, MovieDeletionPreview } from '../../api/types';
import { Modal } from '../../components/Modal';
import { Alert, Bc, Button, Card, Field, Input, Muted, Spinner, Stack } from '../../components/ui';
import { formatDateTime, formatNumber } from '../../components/format';
import { useAuthStore } from '../../store/auth';
import { t, tx } from '../../i18n';

/**
 * Cancellazione del film (solo Superadmin). Possibile solo se nessuno l'ha riscattato: a chi
 * lo possiede viene restituito il prezzo pagato e il film esce dal sito e dalle classifiche.
 */
export function MovieDeletionSection({ movie }: { movie: AdminContent }) {
  const isSuperadmin = useAuthStore((s) => s.user?.role === 'SUPERADMIN');
  const [open, setOpen] = useState(false);
  if (!isSuperadmin) return null;
  if (movie.deletedAt) {
    return <Alert $tone="warning" data-testid="movie-deleted">{t('admin.movieDeletion.giaCancellato', { date: formatDateTime(movie.deletedAt) })}</Alert>;
  }
  return (
    <Card data-testid="movie-deletion">
      <h3 style={{ marginBottom: 4 }}>{t('admin.movieDeletion.titolo')}</h3>
      <Muted $size="0.82rem" style={{ marginBottom: 12 }}>{t('admin.movieDeletion.nota')}</Muted>
      <Button $variant="danger" onClick={() => setOpen(true)}>
        <Trash2 size={15} /> {t('admin.movieDeletion.cancella')}
      </Button>
      {open && <DeleteMovieModal movie={movie} onClose={() => setOpen(false)} />}
    </Card>
  );
}

function DeleteMovieModal({ movie, onClose }: { movie: AdminContent; onClose: () => void }) {
  const navigate = useNavigate();
  const preview = useQuery({
    queryKey: ['admin', 'movies', movie.id, 'deletion-preview'],
    queryFn: () => api<MovieDeletionPreview>(`/admin/movies/${movie.id}/deletion-preview`),
    staleTime: 0,
  });
  const [confirm, setConfirm] = useState('');
  const m = useAdminMutation(() => api<{ refunded: number; totalRefunded: number }>(`/admin/movies/${movie.id}`, { method: 'DELETE', body: { confirm: true } }));
  const p = preview.data;
  const ok = confirm.trim() === movie.title.trim();

  return (
    <Modal title={t('admin.movieDeletion.modaleTitolo', { title: movie.title })} onClose={onClose}>
      <Stack $gap={12} data-testid="delete-movie-modal">
        {preview.isLoading ? (
          <Spinner />
        ) : p && !p.deletable ? (
          <Alert $tone="error" data-testid="movie-not-deletable">{p.reason}</Alert>
        ) : (
          p && (
            <>
              <Alert $tone="error">{t('admin.movieDeletion.irreversibile')}</Alert>
              <Card $padding="12px 14px">
                {p.holders > 0 ? (
                  <span data-testid="refund-summary">
                    {tx('admin.movieDeletion.rimborsi', { holders: <strong>{formatNumber(p.holders)}</strong>, total: <Bc value={p.totalRefund} size={13} /> })}
                  </span>
                ) : (
                  <span data-testid="refund-summary">{t('admin.movieDeletion.nessunAcquirente')}</span>
                )}
              </Card>
              <Muted $size="0.85rem">{t('admin.movieDeletion.effetti')}</Muted>
              <Field label={t('admin.movieDeletion.conferma', { title: movie.title })}>
                <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
              </Field>
            </>
          )
        )}
        {m.error && <Alert $tone="error">{m.error.message}</Alert>}
        <Stack $row $gap={8} $justify="flex-end">
          <Button $variant="secondary" onClick={onClose}>{t('admin.movieDeletion.annulla')}</Button>
          {p?.deletable && (
            <Button
              $variant="danger"
              disabled={!ok || m.isPending}
              onClick={() => m.mutate(undefined, { onSuccess: () => navigate('/admin/pubblicazione?tipo=movies', { replace: true }) })}
            >
              {m.isPending ? t('admin.movieDeletion.inCorso') : t('admin.movieDeletion.cancellaERimborsa')}
            </Button>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
