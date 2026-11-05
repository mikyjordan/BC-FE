import { useState } from 'react';
import { Mail } from 'lucide-react';
import { api } from '../../api/client';
import { useAdminMutation, useAdminNotifications } from '../../api/hooks';
import type { AdminContent, ContentKindPath } from '../../api/types';
import { Alert, Badge, Card, Checkbox, Muted, Stack } from '../../components/ui';
import { ConfirmModal } from '../../components/Modal';
import { formatDateTime, formatNumber } from '../../components/format';
import { hasPermission, useAuthStore } from '../../store/auth';
import { t } from '../../i18n';

/**
 * Avviso email ai utenti: si sceglie qui (o alla creazione / pubblicazione). L'invio parte solo
 * quando il titolo è visibile agli utenti; dopo l'invio mostra l'avanzamento.
 */
export function NotificationSection({ kind, item }: { kind: ContentKindPath; item: AdminContent }) {
  const user = useAuthStore((s) => s.user);
  const canEdit = hasPermission(user, 'content.edit');
  const stats = useAdminNotifications(kind, item.id);
  const [confirmNow, setConfirmNow] = useState(false);
  const mutation = useAdminMutation((notifyOnPublish: boolean) => api<AdminContent>(`/admin/${kind}/${item.id}`, { method: 'PATCH', body: { notifyOnPublish } }));
  const isPublished = item.publicationStatus === 'PUBLISHED';

  const toggle = (value: boolean) => {
    if (value && isPublished) setConfirmNow(true);
    else mutation.mutate(value);
  };

  return (
    <Card data-testid="notification-section">
      <Stack $row $gap={8} $align="center" style={{ marginBottom: 6 }}>
        <Mail size={18} aria-hidden />
        <h3>{t('admin.notificationSection.titolo')}</h3>
      </Stack>
      {item.notificationQueuedAt ? (
        <Stack $gap={10}>
          <Alert $tone="success">
            {t('admin.notificationSection.inviato', { date: formatDateTime(item.notificationQueuedAt), recipients: formatNumber(item.notificationRecipients ?? 0) })}
          </Alert>
          {stats.data && (
            <Stack $row $gap={6} $wrap>
              <Badge $tone="green">{t('admin.notificationSection.inviate', { n: formatNumber(stats.data.sent) })}</Badge>
              {stats.data.pending > 0 && <Badge $tone="blue">{t('admin.notificationSection.inCoda', { n: formatNumber(stats.data.pending) })}</Badge>}
              {stats.data.skipped > 0 && <Badge $tone="neutral">{t('admin.notificationSection.saltate', { n: formatNumber(stats.data.skipped) })}</Badge>}
              {stats.data.failed > 0 && <Badge $tone="red">{t('admin.notificationSection.fallite', { n: formatNumber(stats.data.failed) })}</Badge>}
            </Stack>
          )}
        </Stack>
      ) : (
        <Stack $gap={10}>
          <Muted $size="0.82rem">{t('admin.notificationSection.spiegazione')}</Muted>
          <Checkbox>
            <input
              type="checkbox"
              checked={item.notifyOnPublish}
              disabled={!canEdit || mutation.isPending || item.publicationStatus === 'ARCHIVED'}
              onChange={(e) => toggle(e.target.checked)}
            />
            <span>{t('admin.notificationSection.casella')}</span>
          </Checkbox>
          {item.notifyOnPublish && !isPublished && <Muted $size="0.82rem">{t('admin.notificationSection.inAttesa')}</Muted>}
          {item.notifyOnPublish && isPublished && <Muted $size="0.82rem">{t('admin.notificationSection.inAttesaDisponibilita')}</Muted>}
          {mutation.error && <Alert $tone="error">{mutation.error.message}</Alert>}
          {!canEdit && <Muted $size="0.82rem">{t('admin.notificationSection.nonHaiIlPermesso')}</Muted>}
        </Stack>
      )}
      {confirmNow && (
        <ConfirmModal
          title={t('admin.notificationSection.confermaTitolo')}
          message={t('admin.notificationSection.confermaMessaggio', { title: item.title })}
          confirmLabel={t('admin.notificationSection.confermaPulsante')}
          pending={mutation.isPending}
          error={mutation.error?.message}
          onClose={() => setConfirmNow(false)}
          onConfirm={() => mutation.mutate(true, { onSuccess: () => setConfirmNow(false) })}
        />
      )}
    </Card>
  );
}
