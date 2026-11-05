import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; color-scheme: light; }
  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 15px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 { margin: 0; line-height: 1.2; font-weight: 700; letter-spacing: -0.01em; }
  h1 { font-family: ${({ theme }) => theme.fonts.display}; font-size: clamp(1.6rem, 2.6vw, 2.2rem); }
  h2 { font-size: 1.2rem; }
  h3 { font-size: 1.02rem; }
  p { margin: 0; }
  a { color: inherit; text-decoration: none; }
  button, input, select, textarea { font: inherit; color: inherit; }
  img { max-width: 100%; display: block; }
  :focus-visible { outline: 2px solid ${({ theme }) => theme.colors.brandDark}; outline-offset: 2px; border-radius: 4px; }
  ::selection { background: ${({ theme }) => theme.colors.primarySoft}; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
