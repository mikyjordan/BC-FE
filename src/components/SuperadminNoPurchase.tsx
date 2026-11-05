import { ShieldCheck } from 'lucide-react';
import { Alert, Bc, Card, Stack } from './ui';
import { t } from '../i18n';

/** Il Superadmin gestisce la piattaforma ma non può acquistare: al posto del pulsante vede questo avviso. */
export function SuperadminNoPurchase({ priceBc }: { priceBc: number | null }) {
  return (
    <Card data-testid="superadmin-no-purchase">
      <Stack $gap={10}>
        <h3>{t('components.superadminNoPurchase.acquisto')}</h3>
        {priceBc ? <Bc value={priceBc} size={22} /> : null}
        <Alert $tone="info">
          <Stack $row $gap={8} $align="center">
            <ShieldCheck size={16} aria-hidden />{' '}{t('components.superadminNoPurchase.ilSuperadminNonPuoEffettuare')}</Stack>
        </Alert>
      </Stack>
    </Card>
  );
}
