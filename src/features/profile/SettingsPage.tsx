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

const pwdSchema = z
  .object({ currentPassword: z.string().min(1, 'Obbligatoria'), newPassword: passwordRule, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Le password non coincidono' });

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
      setPwdError(e instanceof Error ? e.message : 'Operazione non riuscita');
    }
  });

  const revoke = async (id: string) => {
    await api(`/auth/sessions/${id}`, { method: 'DELETE' });
    void qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  return (
    <>
      <PageHeader title="Impostazioni" subtitle={user.email} />
      <Stack $gap={18}>
        <Card>
          <h3 style={{ marginBottom: 12 }}>Notifiche</h3>
          <Stack $gap={10}>
            <Checkbox>
              <input type="checkbox" checked={notif.inApp} onChange={(e) => prefs.mutate({ notificationPreferences: { ...notif, inApp: e.target.checked } })} />
              Notifiche nell’app
            </Checkbox>
            <Checkbox>
              <input type="checkbox" checked={notif.email} onChange={(e) => prefs.mutate({ notificationPreferences: { ...notif, email: e.target.checked } })} />
              Notifiche via email
            </Checkbox>
            <Muted $size="0.8rem">Le preferenze vengono salvate subito.</Muted>
          </Stack>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 12 }}>Cambia password</h3>
          <form onSubmit={changePassword} noValidate>
            <Stack $gap={12} style={{ maxWidth: 420 }}>
              {pwdError && <Alert $tone="error">{pwdError}</Alert>}
              <Field label="Password attuale" error={form.formState.errors.currentPassword?.message}>
                <Input type="password" autoComplete="current-password" {...form.register('currentPassword')} />
              </Field>
              <Field label="Nuova password" error={form.formState.errors.newPassword?.message}>
                <Input type="password" autoComplete="new-password" {...form.register('newPassword')} />
              </Field>
              <Field label="Conferma" error={form.formState.errors.confirm?.message}>
                <Input type="password" autoComplete="new-password" {...form.register('confirm')} />
              </Field>
              <Muted $size="0.8rem">Dopo il cambio verranno chiuse tutte le sessioni.</Muted>
              <div><Button type="submit" disabled={form.formState.isSubmitting}>Aggiorna password</Button></div>
            </Stack>
          </form>
        </Card>

        <Card>
          <h3 style={{ marginBottom: 12 }}>Sessioni attive</h3>
          <Stack $gap={10}>
            {sessions.data?.items.map((s) => (
              <Stack key={s.id} $row $justify="space-between" $align="center" $gap={12}>
                <Stack $row $gap={10} $align="center" style={{ minWidth: 0 }}>
                  <MonitorSmartphone size={18} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userAgent ?? 'Dispositivo sconosciuto'}</div>
                    <Muted $size="0.78rem">Dal {formatDateTime(s.createdAt)}{s.ip ? ` · ${s.ip}` : ''}</Muted>
                  </div>
                </Stack>
                <Button $variant="ghost" $size="sm" onClick={() => revoke(s.id)}>
                  <LogOut size={14} /> Revoca
                </Button>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
