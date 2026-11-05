import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { ContentKindPath, PublicContent, PublicationStatus } from '../../api/types';
import { Modal } from '../../components/Modal';
import { Poster } from '../../components/Poster';
import { Alert, Badge, Bc, Muted, Spinner, Stack } from '../../components/ui';
import { STATUS_LABELS } from '../../components/format';
import { PurchaseBadge } from '../../components/PurchaseBadge';
import { t, tx } from '../../i18n';

/**
 * Anteprima della scheda pubblica così come la vedrebbe un utente, ottenuta dall'endpoint
 * amministrativo /preview (funziona anche per bozze). Nessuna azione d'acquisto è possibile qui.
 */
export function PreviewModal({ kind, id, status, onClose }: { kind: ContentKindPath; id: string; status: PublicationStatus; onClose: () => void }) {
  const q = useQuery({ queryKey: ['admin', kind, id, 'preview'], queryFn: () => api<PublicContent>(`/admin/${kind}/${id}/preview`) });
  const c = q.data;
  return (
    <Modal title={t('admin.previewModal.anteprimaSchedaPubblica')} onClose={onClose} wide>
      {status !== 'PUBLISHED' && (
        <Alert $tone="warning" style={{ marginBottom: 16 }}>{tx('admin.previewModal.statoAttualeStatusQuestaScheda', { status: STATUS_LABELS[status] })}</Alert>
      )}
      {!c ? (
        <Spinner />
      ) : (
        <Stack $row $gap={20} $wrap>
          <div style={{ width: 200 }}>
            <Poster src={c.posterUrl} alt={c.title} kind={c.kind} />
          </div>
          <Stack $gap={10} style={{ flex: '1 1 320px' }}>
            <Stack $row $gap={6} $wrap>
              <Badge $tone="blue">{c.kind === 'MOVIE' ? t('common.film') : t('common.serieTv')}</Badge>
              {c.genres.map((g) => <Badge key={g}>{g}</Badge>)}
            </Stack>
            <h1 style={{ fontSize: '1.6rem' }}>{c.title}</h1>
            {c.description && <Muted>{c.description}</Muted>}
            {c.kind === 'MOVIE' && c.director && <Muted>{tx('admin.previewModal.regiaDirector', { director: c.director })}</Muted>}
            {c.kind === 'TV_SERIES' && c.platforms.length > 0 && <Muted>{tx('admin.previewModal.piattaformeV', { v: c.platforms.join(', ') })}</Muted>}
            <div style={{ marginTop: 8 }}>
              <Muted $size="0.8rem">{t('admin.previewModal.prezzoPerQuota')}</Muted>
              {c.purchase.priceBc ? <Bc value={c.purchase.priceBc} size={20} /> : <Muted>{t('admin.previewModal.nonImpostato')}</Muted>}
              <div style={{ marginTop: 6 }}>
                <PurchaseBadge active={c.purchase.purchasable} reason={c.purchase.message ?? c.purchase.reason} />
              </div>
            </div>
          </Stack>
        </Stack>
      )}
    </Modal>
  );
}
