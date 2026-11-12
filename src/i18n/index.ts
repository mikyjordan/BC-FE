/**
 * Testi dell'interfaccia.
 *
 * Tutte le label, i pulsanti e le scritte di BusterCinema stanno in `it.json`: i componenti
 * non contengono testo fisso ma lo prendono da lì con `t('chiave')`. Per cambiare una scritta
 * basta modificare il file JSON (nessun codice da toccare). Il test `tests/i18n.test.ts`
 * fallisce se un componente contiene testo scritto direttamente.
 *
 * Segnaposto: nel testo si scrive `{nome}` e lo si valorizza con `t('chiave', { nome: valore })`.
 * Se il valore è un elemento React (un link, un importo formattato…) si usa `tx()`, che
 * restituisce un frammento React invece di una stringa.
 */
import { Fragment, createElement, type ReactNode } from 'react';
import messages from './it.json' with { type: 'json' };

type Messages = typeof messages;
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends readonly unknown[] ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Chiavi valide del file dei testi: un refuso nella chiave è un errore di compilazione. */
export type TKey = Leaves<Messages>;
export type TParams = Record<string, string | number | null | undefined>;

function lookup(key: string): unknown {
  let node: unknown = messages;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function raw(key: TKey): string {
  const value = lookup(key);
  if (typeof value === 'string') return value;
  if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] testo mancante: ${key}`);
  return key;
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** Testo per la chiave, con i segnaposto `{nome}` sostituiti dai parametri. */
export function t(key: TKey, params?: TParams): string {
  const text = raw(key);
  if (!params) return text;
  return text.replace(PLACEHOLDER, (match, name: string) => (name in params ? String(params[name] ?? '') : match));
}

/** Come `t()`, ma i parametri possono essere elementi React (link, importi, grassetti…). */
export function tx(key: TKey, params: Record<string, ReactNode>): ReactNode {
  const text = raw(key);
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(PLACEHOLDER)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const name = m[1];
    out.push(createElement(Fragment, { key: i++ }, name in params ? params[name] : m[0]));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return createElement(Fragment, null, ...out);
}

/** Elenco di testi (es. paragrafi di una pagina informativa). */
export function tList(key: TKey): string[] {
  const value = lookup(key);
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Lingua e impostazioni regionali usate per date e numeri. */
export const LOCALE = messages.meta.locale;
