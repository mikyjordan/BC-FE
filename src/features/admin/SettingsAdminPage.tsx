import { useState } from 'react';
import { Navigate } from 'react-router';
import styled from 'styled-components';
import { Clapperboard, Tv } from 'lucide-react';
import { useFeatures, useUpdateFeatures } from '../../api/hooks';
import type { Features } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Badge, Button, Card, Muted, PageHeader, Spinner, Stack } from '../../components/ui';
import { useAuthStore } from '../../store/auth';

const Row = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  svg { color: ${({ theme }) => theme.colors.brand}; }
`;

const SECTIONS: Array<{ key: keyof Features; label: string; icon: typeof Tv; description: string }> = [
  { key: 'movies', label: 'Film', icon: Clapperboard, description: 'Catalogo film, schede, acquisti, incassi e riscatti visibili agli utenti.' },
  { key: 'tvSeries', label: 'Serie TV', icon: Tv, description: 'Catalogo serie TV, schede, stagioni e acquisti visibili agli utenti.' },
];

/** Impostazioni riservate al Superadmin: sezioni Film e Serie TV visibili agli utenti. */
export function SettingsAdminPage() {
  const user = useAuthStore((s) => s.user);
  const features = useFeatures();
  const update = useUpdateFeatures();
  const [pending, setPending] = useState<{ key: keyof Features; value: boolean } | null>(null);

  if (user?.role !== 'SUPERADMIN') return <Navigate to="/admin" replace />;
  if (features.isLoading || !features.data) return <Spinner />;
  const f = features.data;
  const label = (k: keyof Features) => SECTIONS.find((s) => s.key === k)!.label;

  return (
    <>
      <PageHeader title="Impostazioni" subtitle="Scegli quali sezioni sono visibili agli utenti. Solo il Superadmin può modificarle." />
      <Stack $gap={12}>
        {SECTIONS.map(({ key, label: l, icon: Icon, description }) => (
          <Row key={key} aria-label={`Sezione ${l}`}>
            <Stack $row $gap={14} $align="center" style={{ minWidth: 0, flex: '1 1 320px' }}>
              <Icon size={26} aria-hidden />
              <div>
                <Stack $row $gap={8} $align="center">
                  <h2>{l}</h2>
                  <Badge $tone={f[key] ? 'green' : 'red'}>{f[key] ? 'Attiva' : 'Disattivata'}</Badge>
                </Stack>
                <Muted $size="0.88rem">{description}</Muted>
              </div>
            </Stack>
            <Button $variant={f[key] ? 'danger' : 'primary'} onClick={() => { update.reset(); setPending({ key, value: !f[key] }); }}>
              {f[key] ? `Disattiva ${l}` : `Attiva ${l}`}
            </Button>
          </Row>
        ))}
        <Alert $tone="info">
          Con una sezione disattivata spariscono menu, tab, home, ricerca e catalogo di quella sezione, e le relative API pubbliche non rispondono.
          Le partecipazioni già acquistate restano nel portafoglio degli utenti e si possono riscattare. Puoi continuare a preparare i contenuti dall’area di amministrazione.
        </Alert>
      </Stack>

      {pending && (
        <ConfirmModal
          title={`${pending.value ? 'Attivare' : 'Disattivare'} la sezione ${label(pending.key)}?`}
          message={
            pending.value
              ? `La sezione ${label(pending.key)} diventerà visibile a tutti gli utenti (solo i titoli pubblicati).`
              : `La sezione ${label(pending.key)} verrà nascosta a tutti gli utenti: menu, tab, catalogo, schede e acquisti non saranno più disponibili.`
          }
          confirmLabel={pending.value ? 'Attiva' : 'Disattiva'}
          danger={!pending.value}
          pending={update.isPending}
          error={update.error?.message}
          onClose={() => setPending(null)}
          onConfirm={() => update.mutate({ [pending.key]: pending.value }, { onSuccess: () => setPending(null) })}
        />
      )}
    </>
  );
}
