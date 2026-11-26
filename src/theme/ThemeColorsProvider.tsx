import { useEffect, useMemo, type ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { api } from '../api/client';
import { buildTheme, DEFAULT_COLORS, type ColorKey, type ThemeColors } from './theme';

/** Colore CSS accettato (come nel backend): niente CSS arbitrario nei colori personalizzati. */
const CSS_COLOR = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgba?|hsla?)\(\s*[0-9.]+%?(?:\s*[,\s/]\s*[0-9.]+%?){2,3}\s*\))$/;
export const isCssColor = (v: unknown): v is string => typeof v === 'string' && CSS_COLOR.test(v.trim());

export type ColorOverrides = Partial<Record<ColorKey, string>>;

/** Tiene solo i nomi di colore conosciuti e i valori validi. */
export function cleanColors(input: Record<string, unknown> | null | undefined): ColorOverrides {
  const out: ColorOverrides = {};
  for (const [k, v] of Object.entries(input ?? {})) if (k in DEFAULT_COLORS && isCssColor(v)) out[k as ColorKey] = v.trim();
  return out;
}

export const mergeColors = (...layers: ColorOverrides[]): ThemeColors => Object.assign({}, DEFAULT_COLORS, ...layers);

/** Anteprima dal pannello del Superadmin: i colori in modifica si vedono subito in tutto il sito. */
export const useThemePreview = create<{ preview: ColorOverrides | null; setPreview: (c: ColorOverrides | null) => void }>((set) => ({
  preview: null,
  setPreview: (preview) => set({ preview }),
}));

const CACHE_KEY = 'bc.themeColors';
function cached(): ColorOverrides | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? cleanColors(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

export const THEME_QUERY_KEY = ['theme'] as const;

/** Colori personalizzati salvati dal Superadmin (vuoto = colori di default). */
export function useCustomColors() {
  return useQuery({
    queryKey: THEME_QUERY_KEY,
    queryFn: async () => cleanColors((await api<{ colors: Record<string, unknown> }>('/theme')).colors),
    staleTime: 5 * 60_000,
    // Ultimi colori noti: niente "lampo" dei colori di default a ogni apertura.
    placeholderData: cached,
  });
}

/** Applica a tutto il sito i colori di default + quelli personalizzati (+ l'eventuale anteprima). */
export function ThemeColorsProvider({ children }: { children: ReactNode }) {
  const custom = useCustomColors().data;
  const preview = useThemePreview((s) => s.preview);
  const colors = useMemo(() => mergeColors(custom ?? {}, preview ?? {}), [custom, preview]);
  const theme = useMemo(() => buildTheme(colors), [colors]);

  useEffect(() => {
    if (!custom) return;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(custom));
    } catch {
      /* archiviazione non disponibile: si ricaricano dal server */
    }
  }, [custom]);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.brand);
  }, [colors.brand]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
