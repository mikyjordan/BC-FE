import { useState } from 'react';
import { Archive, EyeOff, RotateCcw, Send } from 'lucide-react';
import { api } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent, ContentKindPath, PublicationStatus } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Button, Checkbox, Stack } from '../../components/ui';
import { hasPermission, useAuthStore } from '../../store/auth';
import { t } from '../../i18n';

type Action = 'publish' | 'hide' | 'archive' | 'revert-to-draft';

const ACTIONS: Record<Action, { label: string; from: PublicationStatus[]; permission: string; danger?: boolean; icon: typeof Send; describe: (title: string) => string }> = {
  publish: {
    label: t('admin.publicationActions.pubblica'),
    from: ['DRAFT', 'HIDDEN', 'ARCHIVED'],
    permission: 'content.publish',
    icon: Send,
    describe: (title) => t('admin.publicationActions.tDiventeraVisibileATutti', { title }),
  },
  hide: {
    label: t('admin.publicationActions.nascondi'),
    from: ['DRAFT', 'PUBLISHED'],
    permission: 'content.publish',
    icon: EyeOff,
    describe: (title) => t('admin.publicationActions.tVerraRimossoDaTutte', { title }),
  },
  archive: {
    label: t('admin.publicationActions.archivia'),
    from: ['DRAFT', 'PUBLISHED', 'HIDDEN'],
    permission: 'content.archive',
    danger: true,
    icon: Archive,
    describe: (title) => t('admin.publicationActions.tSaraArchiviatoNonPiu', { title }),
  },
  'revert-to-draft': {
    label: t('admin.publicationActions.riportaInBozza'),
    from: ['HIDDEN', 'ARCHIVED'],
    permission: 'content.publish',
    icon: RotateCcw,
    describe: (title) => t('admin.publicationActions.tTorneraInBozzaNon', { title }),
  },
};

/** Pulsanti di pubblicazione: compaiono solo le azioni consentite dallo stato e dai permessi. */
export function PublicationActions({ kind, item, size = 'sm' }: { kind: ContentKindPath; item: AdminContent; size?: 'sm' | 'md' }) {
  const user = useAuthStore((s) => s.user);
  const [pending, setPending] = useState<Action | null>(null);
  const [notify, setNotify] = useState(item.notifyOnPublish);
  const canNotify = !item.notificationQueuedAt;
  const mutation = useAdminMutation((a: Action) =>
    api<AdminContent>(`/admin/${kind}/${item.id}/${a}`, { method: 'POST', body: a === 'publish' && canNotify ? { notifyUsers: notify } : undefined }),
  );

  const available = (Object.keys(ACTIONS) as Action[]).filter(
    (a) => ACTIONS[a].from.includes(item.publicationStatus) && hasPermission(user, ACTIONS[a].permission),
  );
  if (!available.length) return null;

  return (
    <>
      <Stack $row $gap={6} $wrap>
        {available.map((a) => {
          const { icon: Icon, label, danger } = ACTIONS[a];
          return (
            <Button key={a} $size={size} $variant={a === 'publish' ? 'primary' : danger ? 'danger' : 'secondary'} onClick={() => { mutation.reset(); setNotify(item.notifyOnPublish); setPending(a); }}>
              <Icon size={14} /> {label}
            </Button>
          );
        })}
      </Stack>
      {pending && (
        <ConfirmModal
          title={`${ACTIONS[pending].label}?`}
          message={ACTIONS[pending].describe(item.title)}
          confirmLabel={ACTIONS[pending].label}
          danger={ACTIONS[pending].danger}
          pending={mutation.isPending}
          error={mutation.error?.message}
          onClose={() => setPending(null)}
          onConfirm={() => mutation.mutate(pending, { onSuccess: () => setPending(null) })}
        >
          {pending === 'publish' && canNotify && (
            <Checkbox data-testid="publish-notify">
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              <span>{t('admin.publicationActions.inviaEmail')}</span>
            </Checkbox>
          )}
        </ConfirmModal>
      )}
    </>
  );
}
