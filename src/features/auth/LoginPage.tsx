import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { login } from '../../api/client';
import { Alert, Button, Field, Input, Muted, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { loginSchema, type LoginValues } from './schemas';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await login(v.email, v.password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from.startsWith('/') ? from : '/app', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accesso non riuscito');
    }
  });

  return (
    <AuthLayout
      title="Bentornato"
      subtitle="Accedi al tuo portafoglio BusterCinema."
      footer={
        <Muted>
          Non hai un account? <TextLink to="/registrazione">Registrati</TextLink>
        </Muted>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Stack $gap={14}>
          {error && <Alert $tone="error">{error}</Alert>}
          <Field label="Email" error={formState.errors.email?.message}>
            <Input type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register('email')} />
          </Field>
          <Field label="Password" error={formState.errors.password?.message}>
            <Input type="password" autoComplete="current-password" aria-invalid={!!formState.errors.password} {...register('password')} />
          </Field>
          <div style={{ textAlign: 'right' }}>
            <TextLink to="/recupero-password" style={{ fontSize: '0.85rem' }}>
              Password dimenticata?
            </TextLink>
          </div>
          <Button type="submit" $block disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Accesso…' : 'Accedi'}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
