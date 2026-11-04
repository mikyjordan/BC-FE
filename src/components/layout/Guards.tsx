import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../ui';
import { isStaff, useAuthStore } from '../../store/auth';

/** Richiede una sessione attiva. Il controllo reale dei permessi resta sempre lato server. */
export function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <Spinner aria-label="Caricamento" />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireStaff() {
  const user = useAuthStore((s) => s.user);
  if (!isStaff(user)) return <Navigate to="/app" replace />;
  return <Outlet />;
}

export function RedirectIfAuthenticated() {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <Spinner aria-label="Caricamento" />;
  if (status === 'authenticated') return <Navigate to="/app" replace />;
  return <Outlet />;
}
