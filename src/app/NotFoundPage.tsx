import { Link } from 'react-router';
import { Clapperboard } from 'lucide-react';
import { Button, EmptyState } from '../components/ui';

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 16 }}>
      <EmptyState icon={<Clapperboard size={36} />} title="Scena non trovata">
        <p style={{ marginBottom: 14 }}>La pagina che cerchi non esiste.</p>
        <Link to="/app"><Button>Torna alla home</Button></Link>
      </EmptyState>
    </div>
  );
}
