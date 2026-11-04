import type React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { RedirectIfAuthenticated, RequireAuth, RequireStaff } from '../components/layout/Guards';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/PasswordPages';
import { HomePage } from '../features/home/HomePage';
import { MoviesPage, SeriesPage } from '../features/catalog/CatalogPage';
import { MovieDetailPage, SeriesDetailPage } from '../features/catalog/DetailPages';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SettingsPage } from '../features/profile/SettingsPage';
import { PrivacyPage, TermsPage } from '../features/legal/LegalPages';
import { BuyCoinsPage, LeaderboardsPage, NotificationsPage, RewardsPage, TrophiesPage } from '../features/upcoming/ComingSoonPage';
import { NotFoundPage } from './NotFoundPage';

// Caricamento differito: area amministrativa e portafoglio (Recharts) in chunk separati.
const lazyPage = <M,>(load: () => Promise<M>, pick: (m: M) => React.ComponentType) => async () => ({ Component: pick(await load()) });
const wallet = () => import('../features/wallet/WalletPage');
const admin = () => import('../features/admin/admin-pages');

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app" replace /> },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/registrazione', element: <RegisterPage /> },
    ],
  },
  { path: '/recupero-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/termini', element: <TermsPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'film', element: <MoviesPage /> },
          { path: 'film/:id', element: <MovieDetailPage /> },
          { path: 'serie', element: <SeriesPage /> },
          { path: 'serie/:id', element: <SeriesDetailPage /> },
          { path: 'portafoglio', lazy: lazyPage(wallet, (m) => m.WalletPage) },
          { path: 'movimenti', lazy: lazyPage(wallet, (m) => m.TransactionsPage) },
          { path: 'acquista-bustercoin', element: <BuyCoinsPage /> },
          { path: 'classifiche', element: <LeaderboardsPage /> },
          { path: 'premi', element: <RewardsPage /> },
          { path: 'coppe', element: <TrophiesPage /> },
          { path: 'notifiche', element: <NotificationsPage /> },
          { path: 'profilo', element: <ProfilePage /> },
          { path: 'impostazioni', element: <SettingsPage /> },
        ],
      },
      {
        element: <RequireStaff />,
        children: [
          {
            path: '/admin',
            lazy: lazyPage(admin, (m) => m.AdminLayout),
            children: [
              { index: true, lazy: lazyPage(admin, (m) => m.AdminDashboard) },
              { path: 'pubblicazione', lazy: lazyPage(admin, (m) => m.PublicationPage) },
              { path: 'contenuti/:kind/:id', lazy: lazyPage(admin, (m) => m.ContentEditorPage) },
              { path: 'utenti', lazy: lazyPage(admin, (m) => m.UsersPage) },
              { path: 'audit', lazy: lazyPage(admin, (m) => m.AuditPage) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
