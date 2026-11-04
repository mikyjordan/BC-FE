import { useState } from 'react';
import { Archive, EyeOff, RotateCcw, Send } from 'lucide-react';
import { api } from '../../api/client';
import { useAdminMutation } from '../../api/hooks';
import type { AdminContent, ContentKindPath, PublicationStatus } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Button, Stack } from '../../components/ui';
import { hasPermission, useAuthStore } from '../../store/auth';

type Action = 'publish' | 'hide' | 'archive' | 'revert-to-draft';

const ACTIONS: Record<Action, { label: string; from: PublicationStatus[]; permission: string; danger?: boolean; icon: typeof Send; describe: (t: string) => string }> = {
  publish: {
    label: 'Pubblica',
    from: ['DRAFT', 'HIDDEN', 'ARCHIVED'],
    permission: 'content.publish',
    icon: Send,
    describe: (t) => `“${t}” diventerà visibile a tutti gli utenti nel catalogo, nella ricerca e — se abilitato — nella homepage.`,
  },
  hide: {
    label: 'Nascondi',
    from: ['DRAFT', 'PUBLISHED'],
    permission: 'content.publish',
    icon: EyeOff,
    describe: (t) => `“${t}” verrà rimosso da tutte le sezioni pubbliche. Acquisti, storico e partecipazioni restano intatti.`,
  },
  archive: {
    label: 'Archivia',
    from: ['DRAFT', 'PUBLISHED', 'HIDDEN'],
    permission: 'content.archive',
    danger: true,
    icon: Archive,
    describe: (t) => `“${t}” sarà archiviato: non più visibile e gli acquisti verranno chiusi definitivamente. Le partecipazioni esistenti restano.`,
  },
  'revert-to-draft': {
    label: 'Riporta in bozza',
    from: ['HIDDEN', 'ARCHIVED'],
    permission: 'content.publish',
    icon: RotateCcw,
    describe: (t) => `“${t}” tornerà in bozza (non visibile).`,
  },
};

/** Pulsanti di pubblicazione: compaiono solo le azioni consentite dallo stato e dai permessi. */
export function PublicationActions({ kind, item, size = 'sm' }: { kind: ContentKindPath; item: AdminContent; size?: 'sm' | 'md' }) {
  const user = useAuthStore((s) => s.user);
  const [pending, setPending] = useState<Action | null>(null);
  const mutation = useAdminMutation((a: Action) => api<AdminContent>(`/admin/${kind}/${item.id}/${a}`, { method: 'POST' }));

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
            <Button key={a} $size={size} $variant={a === 'publish' ? 'primary' : danger ? 'danger' : 'secondary'} onClick={() => { mutation.reset(); setPending(a); }}>
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
        />
      )}
    </>
  );
}
