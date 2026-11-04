import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { theme } from '../src/theme/theme';
import { Bc, Field, Input } from '../src/components/ui';
import { RequireAuth } from '../src/components/layout/Guards';
import { useAuthStore } from '../src/store/auth';

const wrap = (ui: React.ReactNode) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('componenti', () => {
  it('Bc mostra la moneta e l’importo', () => {
    wrap(<Bc value={125000} />);
    expect(screen.getByText('125.000 B')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bustercoin' })).toBeInTheDocument();
  });

  it('Field collega etichetta, input e suggerimento', () => {
    wrap(<Field label="Password" hint="Almeno 10 caratteri"><Input type="password" /></Field>);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Almeno 10 caratteri').id).toBe(input.getAttribute('aria-describedby'));
  });

  it('RequireAuth reindirizza al login gli utenti anonimi', async () => {
    useAuthStore.setState({ status: 'anonymous', user: null });
    const router = createMemoryRouter(
      [
        { element: <RequireAuth />, children: [{ path: '/app', element: <p>area privata</p> }] },
        { path: '/login', element: <p>pagina login</p> },
      ],
      { initialEntries: ['/app'] },
    );
    wrap(<RouterProvider router={router} />);
    expect(await screen.findByText('pagina login')).toBeInTheDocument();
    expect(screen.queryByText('area privata')).not.toBeInTheDocument();
  });
});
