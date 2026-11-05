import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { api, clearSession } from '../../api/client';
import { useSessions, useUpdateProfile } from '../../api/hooks';
import { Alert, Button, Card, Checkbox, Field, Input, Muted, PageHeader, Stack } from '../../components/ui';
import { formatDateTime } from '../../components/format';
import { useAuthStore } from '../../store/auth';
import { passwordRule } from '../auth/schemas';
import { t, tx } from '../../i18n';

const pwdSchema = z
  .object({ currentPassword: z.string().min(1, t('profile.settingsPage.obbligatoria')), newPassword: passwordRule, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: t('common.lePasswordNonCoincidono') });

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sessions = useSessions();
  const prefs = useUpdateProfile();
  const [pwdError, setPwdError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof pwdSchema>>({ resolver: zodResolver(pwdSchema) });
  const notif = user.profile?.notificationPreferences ?? { email: true, inApp: true };

  const changePassword = form.handleSubmit(async (v) => {
    setPwdError(null);
    try {
      await api('/auth/change-password', { method: 'POST', body: { currentPassword: v.currentPassword, newPassword: v.newPassword } });
      clearSession();
      navigate('/login', { replace: true });
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : t('profile.settingsPage.operazioneNonRiuscita'));
    }
  });

  const revoke = async (id: string) => {
    await api(`/auth/sessions/${id}`, { method: 'DELETE' });
    void qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  return (
    <>
      <PageHeader title={t('profile.settingsPage.impostazioni')} subtitle={user.email} />
      <Stack $gap={18}>
        <Card>
          <h3 style={{ marginBottom: 12 }}>{t('profile.settingsPage.notifiche')}</h3>
          <Stack $gap={10}>
            <Checkbox>
              <input type="checkbox" checked={notif.inApp} onChange={(e) => prefs.mutate({ notificationPreferences: { ...notif, inApp: e.target.checked } })} />{t('profile.settingsPage.notificheNellApp')}</Checkbox>
            <Checkbox>
              <input type="checkbox" checked={notif.email} onChange={(e) => prefs.mutate({ notificationPreferences: { ...notif, email: e.target.checked } })} />{t('profile.settingsPage.notificheViaEmail')}</Checkbox>
            <Muted $size="0.8rem">{t('profile.settingsPage.lePreferenzeVengonoSalvateSubito')}</Muted>
          </Stack>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 12 }}>{t('profile.settingsPage.cambiaPassword')}</h3>
          <form onSubmit={changePassword} noValidate>
            <Stack $gap={12} style={{ maxWidth: 420 }}>
              {pwdError && <Alert $tone="error">{pwdError}</Alert>}
              <Field label={t('profile.settingsPage.passwordAttuale')} error={form.formState.errors.currentPassword?.message}>
                <Input type="password" autoComplete="current-password" {...form.register('currentPassword')} />
              </Field>
              <Field label={t('profile.settingsPage.nuovaPassword')} error={form.formState.errors.newPassword?.message}>
                <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
              </Field>
              <Field label={t('profile.settingsPage.conferma')} error={form.formState.errors.confirm?.message}>
                <Input type="password" autoComplete="new-password" {...form.register('confirm')} />
              </Field>
              <Muted $size="0.8rem">{t('profile.settingsPage.dopoIlCambioVerrannoChiuse')}</Muted>
              <div><Button type="submit" disabled={form.formState.isSubmitting}>{t('profile.settingsPage.aggiornaPassword')}</Button></div>
            </Stack>
          </form>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 12 }}>{t('profile.settingsPage.sessioniAttive')}</h3>
          <Stack $gap={10}>
            {sessions.data?.items.map((s) => (
              <Stack key={s.id} $row $justify="space-between" $align="center" $gap={12}>
                <Stack $row $gap={10} $align="center" style={{ minWidth: 0 }}>
                  <MonitorSmartphone size={18} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userAgent ?? t('profile.settingsPage.dispositivoSconosciuto')}</div>
                    <Muted $size="0.78rem">{tx('profile.settingsPage.dalCreatedatV', { createdAt: formatDateTime(s.createdAt), v: s.ip ? ` · ${s.ip}` : '' })}</Muted>
                  </div>
                </Stack>
                <Button $variant="ghost" $size="sm" onClick={() => revoke(s.id)}>
                  <LogOut size={14} />{' '}{t('profile.settingsPage.revoca')}</Button>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
