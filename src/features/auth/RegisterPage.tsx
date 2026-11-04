import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { ApiError, register as registerUser } from '../../api/client';
import { Alert, Button, Checkbox, Field, FieldError, Input, Muted, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { registerSchema, type RegisterValues } from './schemas';

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
        setError(err instanceof Error ? err.message : 'Registrazione non riuscita');
      }
    }
  });

  return (
    <AuthLayout
      title="Crea il tuo account"
      subtitle="Ricevi subito 1.000.000 di Bustercoin di benvenuto."
      footer={
        <Muted>
          Hai già un account? <TextLink to="/login">Accedi</TextLink>
        </Muted>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack $gap={14}>
          {error && <Alert $tone="error">{error}</Alert>}
          <Field label="Email" error={e.email?.message}>
            <Input type="email" autoComplete="email" aria-invalid={!!e.email} {...register('email')} />
          </Field>
          <Field label="Nome utente" error={e.username?.message} hint="Visibile nelle classifiche">
            <Input autoComplete="username" aria-invalid={!!e.username} {...register('username')} />
          </Field>
          <Field label="Password" error={e.password?.message} hint="Almeno 10 caratteri, con lettere e numeri">
            <Input type="password" autoComplete="new-password" aria-invalid={!!e.password} {...register('password')} />
          </Field>
          <Field label="Conferma password" error={e.confirm?.message}>
            <Input type="password" autoComplete="new-password" aria-invalid={!!e.confirm} {...register('confirm')} />
          </Field>
          <Checkbox>
            <input type="checkbox" {...register('acceptTerms')} />
            <span>
              Accetto i <Link to="/termini" target="_blank" style={{ textDecoration: 'underline' }}>termini e condizioni</Link> e ho letto
              l’<Link to="/privacy" target="_blank" style={{ textDecoration: 'underline' }}>informativa privacy</Link>. So che Bustercoin è una
              valuta virtuale di gioco.
            </span>
          </Checkbox>
          {e.acceptTerms && <FieldError>{e.acceptTerms.message}</FieldError>}
          <Button type="submit" $block disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Creazione account…' : 'Registrati'}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
