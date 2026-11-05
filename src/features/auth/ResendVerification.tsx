import { useState } from 'react';
import { resendVerification } from '../../api/client';
import { Alert, Button, Stack } from '../../components/ui';
import { t } from '../../i18n';

/** Pulsante "Reinvia email di conferma" con l'esito dell'operazione. */
export function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const send = async () => {
    setState('sending');
    try {
      await resendVerification(email);
      setState('sent');
    } catch {
      setState('error');
    }
  };
  return (
    <Stack $gap={10}>
      {state === 'sent' && <Alert $tone="success">{t('auth.resendVerification.inviata', { email })}</Alert>}
      {state === 'error' && <Alert $tone="error">{t('auth.resendVerification.errore')}</Alert>}
      <Button type="button" $variant="secondary" disabled={state === 'sending' || !email} onClick={send}>
        {state === 'sending' ? t('auth.resendVerification.invio') : t('auth.resendVerification.reinvia')}
      </Button>
    </Stack>
  );
}
