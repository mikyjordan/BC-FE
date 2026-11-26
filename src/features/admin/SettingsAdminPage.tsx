import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import styled from 'styled-components';
import { Clapperboard, Coins, Tv } from 'lucide-react';
import { useEconomy, useFeatures, useUpdateEconomy, useUpdateFeatures } from '../../api/hooks';
import type { Features } from '../../api/types';
import { ConfirmModal } from '../../components/Modal';
import { Alert, Badge, Button, Card, Field, Input, Muted, PageHeader, Spinner, Stack } from '../../components/ui';
import { useAuthStore } from '../../store/auth';
import { t } from '../../i18n';
import { ClockCard } from './ClockCard';
import { ThemeColorsCard } from './ThemeColorsCard';

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

/** Bonus di benvenuto e settimanale: i valori stanno nella configurazione, non nel codice. */
function EconomyCard() {
  const economy = useEconomy();
  const update = useUpdateEconomy();
  const [initial, setInitial] = useState('');
  const [weekly, setWeekly] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!economy.data) return;
    setInitial(String(economy.data.initialBonus));
    setWeekly(String(economy.data.weeklyBonus));
  }, [economy.data]);
  const valid = (v: string) => /^\d+$/.test(v) && Number(v) <= 1_000_000_000_000;
  const ok = valid(initial) && valid(weekly);
  const changed = !!economy.data && (Number(initial) !== economy.data.initialBonus || Number(weekly) !== economy.data.weeklyBonus);

  return (
    <Card data-testid="economy-settings">
      <Stack $row $gap={10} $align="center" style={{ marginBottom: 6 }}>
        <Coins size={24} aria-hidden />
        <h2>{t('admin.settingsAdminPage.economiaTitolo')}</h2>
      </Stack>
      <Muted $size="0.88rem" style={{ marginBottom: 14 }}>{t('admin.settingsAdminPage.economiaSpiegazione')}</Muted>
      {economy.isLoading ? <Spinner /> : (
        <Stack $gap={12}>
          <Stack $row $gap={12} $wrap>
            <div style={{ flex: '1 1 220px' }}>
              <Field label={t('admin.settingsAdminPage.bonusBenvenuto')} hint={t('admin.settingsAdminPage.bonusBenvenutoNota')} error={valid(initial) ? undefined : t('admin.settingsAdminPage.importoNonValido')}>
                <Input type="number" min={0} step={1} value={initial} onChange={(e) => { setSaved(false); setInitial(e.target.value); }} />
              </Field>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <Field label={t('admin.settingsAdminPage.bonusSettimanale')} hint={t('admin.settingsAdminPage.bonusSettimanaleNota')} error={valid(weekly) ? undefined : t('admin.settingsAdminPage.importoNonValido')}>
                <Input type="number" min={0} step={1} value={weekly} onChange={(e) => { setSaved(false); setWeekly(e.target.value); }} />
              </Field>
            </div>
          </Stack>
          {update.error && <Alert $tone="error">{update.error.message}</Alert>}
          {saved && <Alert $tone="success">{t('admin.settingsAdminPage.bonusSalvati')}</Alert>}
          <div>
            <Button disabled={!ok || !changed || update.isPending} onClick={() => update.mutate({ initialBonus: Number(initial), weeklyBonus: Number(weekly) }, { onSuccess: () => setSaved(true) })}>
              {t('admin.settingsAdminPage.salvaBonus')}
            </Button>
          </div>
        </Stack>
      )}
    </Card>
  );
}

/** Impostazioni riservate al Superadmin: sezioni Film e Serie TV visibili agli utenti, bonus. */
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
        <EconomyCard />
        <ThemeColorsCard />
        <ClockCard />
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
