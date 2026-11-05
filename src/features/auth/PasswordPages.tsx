import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { api } from '../../api/client';
import { Alert, Button, Field, Input, Muted, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { passwordRule } from './schemas';
import { t } from '../../i18n';

export function ForgotPasswordPage() {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.email(t('auth.passwordPages.emailNonValida')) })),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      const res = await api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } });
      setDone(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.passwordPages.richiestaNonRiuscita'));
    }
  });

  return (
    <AuthLayout title={t('auth.passwordPages.recuperaLaPassword')} subtitle={t('auth.passwordPages.tiInvieremoUnLinkValido')} footer={<TextLink to="/login">{t('auth.passwordPages.tornaAllAccesso')}</TextLink>}>
      {done ? (
        <Alert $tone="success">{done}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack $gap={14}>
            {error && <Alert $tone="error">{error}</Alert>}
            <Field label={t('common.email')} error={formState.errors.email?.message}>
              <Input type="email" autoComplete="email" {...register('email')} />
            </Field>
            <Button type="submit" $block disabled={formState.isSubmitting}>{t('auth.passwordPages.inviaLink')}</Button>
          </Stack>
        </form>
      )}
    </AuthLayout>
  );
}

const resetSchema = z.object({ password: passwordRule, confirm: z.string() }).refine((v) => v.password === v.confirm, {
  path: ['confirm'],
  message: t('common.lePasswordNonCoincidono'),
});

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.passwordPages.operazioneNonRiuscita'));
    }
  });

  return (
    <AuthLayout title={t('auth.passwordPages.nuovaPassword')} footer={<TextLink to="/login">{t('auth.passwordPages.vaiAllAccesso')}</TextLink>}>
      {!token ? (
        <Alert $tone="error">{t('auth.passwordPages.linkNonValido')}</Alert>
      ) : done ? (
        <Alert $tone="success">{t('auth.passwordPages.passwordAggiornataOraPuoiAccedere')}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack $gap={14}>
            {error && <Alert $tone="error">{error}</Alert>}
            <Field label={t('auth.passwordPages.nuovaPassword')} error={formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </Field>
            <Field label={t('auth.passwordPages.confermaPassword')} error={formState.errors.confirm?.message}>
              <Input type="password" autoComplete="new-password" {...register('confirm')} />
            </Field>
            <Muted $size="0.8rem">{t('auth.passwordPages.perSicurezzaVerrannoChiuseTutte')}</Muted>
            <Button type="submit" $block disabled={formState.isSubmitting}>{t('auth.passwordPages.salvaPassword')}</Button>
          </Stack>
        </form>
      )}
    </AuthLayout>
  );
}
