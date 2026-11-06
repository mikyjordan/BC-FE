import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { ApiError, register as registerUser } from '../../api/client';
import { Alert, Button, Checkbox, Field, FieldError, Input, Muted, Stack } from '../../components/ui';
import { ResendVerification } from './ResendVerification';
import { useBonusAmounts } from '../info/bonusTexts';
import { useUsernameAvailability } from '../../api/hooks';
import { AuthLayout, TextLink } from './AuthLayout';
import { registerSchema, type RegisterValues } from './schemas';
import { t, tx } from '../../i18n';

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError: setFieldError, watch } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });
  const e = formState.errors;
  const b = useBonusAmounts();
  // Disponibilità dello username mentre si scrive (con una breve attesa tra un tasto e l'altro)
  const typed = (watch('username') ?? '').trim();
  const [checked, setChecked] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setChecked(typed), 400);
    return () => clearTimeout(id);
  }, [typed]);
  const availability = useUsernameAvailability(checked);

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      const res = await registerUser({ email: v.email, username: v.username, password: v.password, acceptTerms: true });
      setPendingEmail(res.email);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'USER_EXISTS') {
        setFieldError(err.message.includes('Email') ? 'email' : 'username', { message: err.message });
      } else {
        setError(err instanceof Error ? err.message : t('auth.registerPage.registrazioneNonRiuscita'));
      }
    }
  });

  if (pendingEmail) {
    return (
      <AuthLayout
        title={t('auth.registerPage.controllaLaTuaEmail')}
        subtitle={t('auth.registerPage.ultimoPasso')}
        footer={<Muted>{t('auth.registerPage.giaConfermato')}{' '}<TextLink to="/login">{t('auth.registerPage.accedi')}</TextLink></Muted>}
      >
        <Stack $gap={14} data-testid="registration-pending">
          <Alert $tone="success">{tx('auth.registerPage.emailInviata', { email: <strong>{pendingEmail}</strong> })}</Alert>
          <Muted>{t('auth.registerPage.nonTrovi')}</Muted>
          <ResendVerification email={pendingEmail} />
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.registerPage.creaIlTuoAccount')}
      subtitle={t('auth.registerPage.riceviBonus', { bonus: b.bonus })}
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
          <Field
            label={t('auth.registerPage.nomeUtente')}
            error={e.username?.message ?? (availability.data && !availability.data.available ? availability.data.reason : undefined)}
            hint={availability.data?.available ? t('auth.registerPage.nomeDisponibile') : t('auth.registerPage.nomeUtenteDefinitivo')}
          >
            <Input autoComplete="username" aria-invalid={!!e.username || availability.data?.available === false} {...register('username')} />
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
