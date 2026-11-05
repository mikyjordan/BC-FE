import { Navigate, Outlet } from 'react-router';
import { hasWallet, useAuthStore } from '../../store/auth';

/** Portafoglio, movimenti e acquisto di Bustercoin non esistono per il Superadmin. */
export function RequireWallet() {
  const user = useAuthStore((s) => s.user);
  if (!hasWallet(user)) return <Navigate to="/app" replace />;
  return <Outlet />;
}
