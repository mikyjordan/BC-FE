import type React from 'react';
import { createBrowserRouter } from 'react-router';
import { AppShell } from '../components/layout/AppShell';
import { RedirectIfAuthenticated, RequireAuth, RequireStaff } from '../components/layout/Guards';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ForgotPasswordPage, ResetPasswordPage } from '../features/auth/PasswordPages';
import { VerifyEmailPage } from '../features/auth/VerifyEmailPage';
import { HomePage } from '../features/home/HomePage';
import { MoviesPage, SeriesPage } from '../features/catalog/CatalogPage';
import { MovieDetailPage, SeriesDetailPage } from '../features/catalog/DetailPages';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SettingsPage } from '../features/profile/SettingsPage';
import { PrivacyPage, TermsPage } from '../features/legal/LegalPages';
import { HowItWorksPage } from '../features/info/HowItWorksPage';
import { LandingPage } from '../features/landing/LandingPage';
import { BuyCoinsPage, LeaderboardsPage, NotificationsPage, RewardsPage, TrophiesPage } from '../features/upcoming/ComingSoonPage';
import { NotFoundPage } from './NotFoundPage';
import { RequireWallet } from '../components/layout/RequireWallet';
import { RequireFeature } from '../components/layout/RequireFeature';

// Caricamento differito: area amministrativa e portafoglio (Recharts) in chunk separati.
const lazyPage = <M,>(load: () => Promise<M>, pick: (m: M) => React.ComponentType) => async () => ({ Component: pick(await load()) });
const wallet = () => import('../features/wallet/WalletPage');
const admin = () => import('../features/admin/admin-pages');

export const router = createBrowserRouter([
  // Pagina iniziale pubblica: spiega il gioco; chi è già entrato va direttamente nell'app.
  { path: '/', element: <LandingPage /> },
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/registrazione', element: <RegisterPage /> },
    ],
  },
  { path: '/verifica-email', element: <VerifyEmailPage /> },
  { path: '/recupero-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/termini', element: <TermsPage /> },
  { path: '/come-funziona', element: <HowItWorksPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppShell />,
        children: [
          { index: true, element: <HomePage /> },
          {
            element: <RequireFeature feature="movies" />,
            children: [
              { path: 'film', element: <MoviesPage /> },
              { path: 'film/:id', element: <MovieDetailPage /> },
            ],
          },
          {
            element: <RequireFeature feature="tvSeries" />,
            children: [
              { path: 'serie', element: <SeriesPage /> },
              { path: 'serie/:id', element: <SeriesDetailPage /> },
            ],
          },
          {
            element: <RequireWallet />,
            children: [
              { path: 'portafoglio', lazy: lazyPage(wallet, (m) => m.WalletPage) },
              { path: 'movimenti', lazy: lazyPage(wallet, (m) => m.TransactionsPage) },
              { path: 'acquista-bustercoin', element: <BuyCoinsPage /> },
            ],
          },
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
              { path: 'impostazioni', lazy: lazyPage(admin, (m) => m.SettingsAdminPage) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
