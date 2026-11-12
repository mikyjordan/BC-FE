import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { theme } from './theme/theme';
import { GlobalStyle } from './theme/GlobalStyle';
import { refreshSession } from './api/client';
import { ApiError } from './api/client';
import { registerServiceWorker } from './app/service-worker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Nessun retry sugli errori 4xx (es. 404 di un titolo non pubblicato).
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});

// Ripristina la sessione dal cookie httpOnly (se presente) prima del primo render protetto.
void refreshSession();

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
