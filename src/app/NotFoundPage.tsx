import { Link } from 'react-router';
import { Clapperboard } from 'lucide-react';
import { Button, EmptyState } from '../components/ui';
import { t } from '../i18n';

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 16 }}>
      <EmptyState icon={<Clapperboard size={36} />} title={t('app.notFoundPage.scenaNonTrovata')}>
        <p style={{ marginBottom: 14 }}>{t('app.notFoundPage.laPaginaCheCerchiNon')}</p>
        <Link to="/app"><Button>{t('app.notFoundPage.tornaAllaHome')}</Button></Link>
      </EmptyState>
    </div>
  );
}
