import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ApiError, verifyEmail } from '../../api/client';
import { Alert, Button, Field, Input, Muted, Spinner, Stack } from '../../components/ui';
import { AuthLayout, TextLink } from './AuthLayout';
import { ResendVerification } from './ResendVerification';
import { t } from '../../i18n';

/** Pagina aperta dal link "Conferma email": attiva l'account ed entra direttamente nell'app. */
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [error, setError] = useState<{ code: string; message: string } | null>(token ? null : { code: 'INVALID_TOKEN', message: t('auth.verifyEmailPage.linkMancante') });
  const [email, setEmail] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // Il link è monouso: una sola richiesta anche se React esegue l'effetto due volte.
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then((welcomeBonus) => navigate('/app', { replace: true, state: { welcomeBonus } }))
      .catch((err) => setError(err instanceof ApiError ? { code: err.code, message: err.message } : { code: 'ERROR', message: t('auth.verifyEmailPage.erroreGenerico') }));
  }, [token, navigate]);

  if (!error) {
    return (
      <AuthLayout title={t('auth.verifyEmailPage.titolo')} subtitle={t('auth.verifyEmailPage.attendi')}>
        <Spinner aria-label={t('auth.verifyEmailPage.attendi')} />
      </AuthLayout>
    );
  }

  if (error.code === 'ALREADY_VERIFIED') {
    return (
      <AuthLayout title={t('auth.verifyEmailPage.giaConfermata')} subtitle={error.message}>
        <Button $block onClick={() => navigate('/login')}>{t('auth.verifyEmailPage.vaiAllAccesso')}</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.verifyEmailPage.linkNonValido')}
      subtitle={t('auth.verifyEmailPage.richiediNuovoLink')}
      footer={<Muted><TextLink to="/login">{t('auth.verifyEmailPage.tornaAllAccesso')}</TextLink></Muted>}
    >
      <Stack $gap={14}>
        <Alert $tone="error">{error.message}</Alert>
        <Field label={t('common.email')}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <ResendVerification email={email.trim()} />
      </Stack>
    </AuthLayout>
  );
}
