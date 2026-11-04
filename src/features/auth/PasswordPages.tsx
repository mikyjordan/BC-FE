import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { api } from '../../api/client';
import { Alert, Button, Field, Input, Muted, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { passwordRule } from './schemas';

export function ForgotPasswordPage() {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.email('Email non valida') })),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      const res = await api<{ message: string }>('/auth/forgot-password', { method: 'POST', body: { email } });
      setDone(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Richiesta non riuscita');
    }
  });

  return (
    <AuthLayout title="Recupera la password" subtitle="Ti invieremo un link valido per 60 minuti." footer={<TextLink to="/login">Torna all’accesso</TextLink>}>
      {done ? (
        <Alert $tone="success">{done}</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack $gap={14}>
            {error && <Alert $tone="error">{error}</Alert>}
            <Field label="Email" error={formState.errors.email?.message}>
              <Input type="email" autoComplete="email" {...register('email')} />
            </Field>
            <Button type="submit" $block disabled={formState.isSubmitting}>
              Invia link
            </Button>
          </Stack>
        </form>
      )}
    </AuthLayout>
  );
}

const resetSchema = z.object({ password: passwordRule, confirm: z.string() }).refine((v) => v.password === v.confirm, {
  path: ['confirm'],
  message: 'Le password non coincidono',
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
      setError(e instanceof Error ? e.message : 'Operazione non riuscita');
    }
  });

  return (
    <AuthLayout title="Nuova password" footer={<TextLink to="/login">Vai all’accesso</TextLink>}>
      {!token ? (
        <Alert $tone="error">Link non valido.</Alert>
      ) : done ? (
        <Alert $tone="success">Password aggiornata. Ora puoi accedere.</Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Stack $gap={14}>
            {error && <Alert $tone="error">{error}</Alert>}
            <Field label="Nuova password" error={formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...register('password')} />
            </Field>
            <Field label="Conferma password" error={formState.errors.confirm?.message}>
              <Input type="password" autoComplete="new-password" {...register('confirm')} />
            </Field>
            <Muted $size="0.8rem">Per sicurezza verranno chiuse tutte le sessioni attive.</Muted>
            <Button type="submit" $block disabled={formState.isSubmitting}>
              Salva password
            </Button>
          </Stack>
        </form>
      )}
    </AuthLayout>
  );
}
