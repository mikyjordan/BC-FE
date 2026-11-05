import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { ApiError, login } from '../../api/client';
import { ResendVerification } from './ResendVerification';
import { Alert, Button, Field, Input, Muted, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { loginSchema, type LoginValues } from './schemas';
import { t } from '../../i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    setUnverifiedEmail(null);
    try {
      await login(v.email, v.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/') ? from : '/app', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(v.email);
      setError(e instanceof Error ? e.message : t('auth.loginPage.accessoNonRiuscito'));
    }
  });

  return (
    <AuthLayout
      title={t('auth.loginPage.bentornato')}
      subtitle={t('auth.loginPage.accediAlTuoPortafoglioBustercinema')}
      footer={
        <Muted>{t('auth.loginPage.nonHaiUnAccount')}{' '}<TextLink to="/registrazione">{t('auth.loginPage.registrati')}</TextLink>
        </Muted>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack $gap={14}>
          {error && <Alert $tone={unverifiedEmail ? 'warning' : 'error'}>{error}</Alert>}
          {unverifiedEmail && <ResendVerification email={unverifiedEmail} />}
          <Field label={t('common.email')} error={formState.errors.email?.message}>
            <Input type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register('email')} />
          </Field>
          <Field label={t('auth.loginPage.password')} error={formState.errors.password?.message}>
            <Input type="password" autoComplete="current-password" aria-invalid={!!formState.errors.password} {...register('password')} />
          </Field>
          <div style={{ textAlign: 'right' }}>
            <TextLink to="/recupero-password" style={{ fontSize: '0.85rem' }}>{t('auth.loginPage.passwordDimenticata')}</TextLink>
          </div>
          <Button type="submit" $block disabled={formState.isSubmitting}>
            {formState.isSubmitting ? t('auth.loginPage.accesso') : t('auth.loginPage.accedi')}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
