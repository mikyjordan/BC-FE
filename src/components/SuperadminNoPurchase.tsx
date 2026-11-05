import { ShieldCheck } from 'lucide-react';
import { Alert, Bc, Card, Stack } from './ui';

/** Il Superadmin gestisce la piattaforma ma non può acquistare: al posto del pulsante vede questo avviso. */
export function SuperadminNoPurchase({ priceBc }: { priceBc: number | null }) {
  return (
    <Card data-testid="superadmin-no-purchase">
      <Stack $gap={10}>
        <h3>Acquisto</h3>
        {priceBc ? <Bc value={priceBc} size={22} /> : null}
        <Alert $tone="info">
          <Stack $row $gap={8} $align="center">
            <ShieldCheck size={16} aria-hidden /> Il Superadmin non può effettuare acquisti.
          </Stack>
        </Alert>
      </Stack>
    </Card>
  );
}
