import { Navigate, Outlet } from 'react-router';
import { useFeatures } from '../../api/hooks';
import type { Features } from '../../api/types';
import { Spinner } from '../ui';
import { t } from '../../i18n';

/** Le pagine di una sezione disattivata dal Superadmin non sono raggiungibili: si torna alla home. */
export function RequireFeature({ feature }: { feature: keyof Features }) {
  const features = useFeatures();
  if (features.isLoading) return <Spinner aria-label={t('components.requireFeature.caricamento')} />;
  if (!features.data?.[feature]) return <Navigate to="/app" replace />;
  return <Outlet />;
}
