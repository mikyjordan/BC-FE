import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { ApiError, register as registerUser } from '../../api/client';
import { Alert, Button, Checkbox, Field, FieldError, Input, Muted, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { registerSchema, type RegisterValues } from './schemas';
import { t, tx } from '../../i18n';

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError: setFieldError } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });
  const e = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await registerUser({ email: v.email, username: v.username, password: v.password, acceptTerms: true });
      navigate('/app', { replace: true, state: { welcome: true } });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'USER_EXISTS') {
        setFieldError(err.message.includes('Email') ? 'email' : 'username', { message: err.message });
      } else {
        setError(err instanceof Error ? err.message : t('auth.registerPage.registrazioneNonRiuscita'));
      }
    }
  });

  return (
    <AuthLayout
      title={t('auth.registerPage.creaIlTuoAccount')}
      subtitle={t('auth.registerPage.riceviSubito1000000')}
      footer={
        <Muted>{t('auth.registerPage.haiGiaUnAccount')}{' '}<TextLink to="/login">{t('auth.registerPage.accedi')}</TextLink>
        </Muted>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack $gap={14}>
          {error && <Alert $tone="error">{error}</Alert>}
          <Field label={t('common.email')} error={e.email?.message}>
            <Input type="email" autoComplete="email" aria-invalid={!!e.email} {...register('email')} />
          </Field>
          <Field label={t('auth.registerPage.nomeUtente')} error={e.username?.message} hint={t('auth.registerPage.visibileNelleClassifiche')}>
            <Input autoComplete="username" aria-invalid={!!e.username} {...register('username')} />
          </Field>
          <Field label={t('auth.registerPage.password')} error={e.password?.message} hint={t('auth.registerPage.almeno10CaratteriConLettere')}>
            <Input type="password" autoComplete="new-password" aria-invalid={!!e.password} {...register('password')} />
          </Field>
          <Field label={t('auth.registerPage.confermaPassword')} error={e.confirm?.message}>
            <Input type="password" autoComplete="new-password" aria-invalid={!!e.confirm} {...register('confirm')} />
          </Field>
          <Checkbox>
            <input type="checkbox" {...register('acceptTerms')} />
            <span>{tx('auth.registerPage.accettoILinkEHo', { link: <Link to="/termini" target="_blank" style={{ textDecoration: 'underline' }}>{t('auth.registerPage.terminiECondizioni')}</Link>, link2: <Link to="/privacy" target="_blank" style={{ textDecoration: 'underline' }}>{t('auth.registerPage.informativaPrivacy')}</Link> })}</span>
          </Checkbox>
          {e.acceptTerms && <FieldError>{e.acceptTerms.message}</FieldError>}
          <Button type="submit" $block disabled={formState.isSubmitting}>
            {formState.isSubmitting ? t('auth.registerPage.creazioneAccount') : t('auth.registerPage.registrati')}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
