import { useState } from 'react';
import { Navigate } from 'react-router';
import styled from 'styled-components';
import { Clapperboard, Tv } from 'lucide-react';
import { useFeatures, useUpdateFeatures } from '../../api/hooks';
import type { Features } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Badge, Button, Card, Muted, PageHeader, Spinner, Stack } from '../../components/ui';
import { useAuthStore } from '../../store/auth';
import { t } from '../../i18n';

const Row = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  svg { color: ${({ theme }) => theme.colors.brand}; }
`;

const SECTIONS: Array<{ key: keyof Features; label: string; icon: typeof Tv; description: string }> = [
  { key: 'movies', label: t('common.film'), icon: Clapperboard, description: t('admin.settingsAdminPage.catalogoFilmSchedeAcquistiIncassi') },
  { key: 'tvSeries', label: t('common.serieTv'), icon: Tv, description: t('admin.settingsAdminPage.catalogoSerieTvSchedeStagioni') },
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
      <PageHeader title={t('admin.settingsAdminPage.impostazioni')} subtitle={t('admin.settingsAdminPage.scegliQualiSezioniSonoVisibili')} />
      <Stack $gap={12}>
        {SECTIONS.map(({ key, label: l, icon: Icon, description }) => (
          <Row key={key} aria-label={t('admin.settingsAdminPage.sezioneL', { l })}>
            <Stack $row $gap={14} $align="center" style={{ minWidth: 0, flex: '1 1 320px' }}>
              <Icon size={26} aria-hidden />
              <div>
                <Stack $row $gap={8} $align="center">
                  <h2>{l}</h2>
                  <Badge $tone={f[key] ? 'green' : 'red'}>{f[key] ? t('admin.settingsAdminPage.attiva') : t('admin.settingsAdminPage.disattivata')}</Badge>
                </Stack>
                <Muted $size="0.88rem">{description}</Muted>
              </div>
            </Stack>
            <Button $variant={f[key] ? 'danger' : 'primary'} onClick={() => { update.reset(); setPending({ key, value: !f[key] }); }}>
              {f[key] ? t('admin.settingsAdminPage.disattivaL', { l }) : t('admin.settingsAdminPage.attivaL', { l })}
            </Button>
          </Row>
        ))}
        <Alert $tone="info">{t('admin.settingsAdminPage.conUnaSezioneDisattivataSpariscono')}</Alert>
      </Stack>

      {pending && (
        <ConfirmModal
          title={t('admin.settingsAdminPage.vLaSezioneKey', { v: pending.value ? t('admin.settingsAdminPage.attivare') : t('admin.settingsAdminPage.disattivare'), key: label(pending.key) })}
          message={
            pending.value
              ? t('admin.settingsAdminPage.laSezioneKeyDiventeraVisibile', { key: label(pending.key) })
              : t('admin.settingsAdminPage.laSezioneKeyVerraNascosta', { key: label(pending.key) })
          }
          confirmLabel={pending.value ? t('admin.settingsAdminPage.attiva') : t('admin.settingsAdminPage.disattiva')}
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
