/**
 * Tutte le scritte dell'interfaccia devono stare in src/i18n/it.json.
 * Questo test fallisce se un componente contiene testo scritto direttamente, se si usa una
 * chiave inesistente, se nel file restano chiavi inutilizzate o se i segnaposto {nome}
 * non corrispondono ai parametri passati.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { describe, expect, it } from '@jest/globals';
import { files, findHardcoded, findTranslationCalls } from '../scripts/i18n-rules.mjs';
import messages from '../src/i18n/it.json' with { type: 'json' };

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const sources = files(SRC).map((f) => ({ file: path.relative(SRC, f), code: readFileSync(f, 'utf8') }));

function flatten(obj: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
    else out.set(key, v);
  }
  return out;
}
const flat = flatten(messages);
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('testi dell’interfaccia nel file src/i18n/it.json', () => {
  it('nessun componente contiene scritte fisse', () => {
    const offenders = sources.flatMap(({ file, code }) => findHardcoded(code, parse).map((h) => `${file}:${h.line}  «${h.text}»`));
    // l'elenco nel messaggio d'errore indica le scritte da spostare in src/i18n/it.json
    expect(offenders).toEqual([]);
  });

  const calls = sources.flatMap(({ file, code }) => findTranslationCalls(code, parse).map((c) => ({ ...c, file })));

  it('ogni chiave usata esiste ed è un testo', () => {
    const bad = calls.filter((c) => c.key === null || !flat.has(c.key)).map((c) => `${c.file}:${c.line}  ${c.key ?? '(chiave non letterale)'}`);
    expect(bad).toEqual([]);
  });

  it('i parametri passati corrispondono ai segnaposto {nome} del testo', () => {
    const bad = calls
      .filter((c) => c.key && typeof flat.get(c.key) === 'string')
      .filter((c) => JSON.stringify(placeholders(flat.get(c.key!) as string)) !== JSON.stringify([...(c.params ?? [])].sort()))
      .map((c) => `${c.file}:${c.line}  ${c.key}: testo ${JSON.stringify(placeholders(flat.get(c.key!) as string))} ≠ parametri ${JSON.stringify(c.params ?? [])}`);
    expect(bad).toEqual([]);
  });

  it('nel file non restano testi inutilizzati', () => {
    const used = new Set(calls.map((c) => c.key));
    const config = ['meta.locale', 'meta.lang', 'app.meta.name', 'app.meta.shortName', 'app.meta.description', 'app.meta.pageDescription'];
    const unused = [...flat.keys()].filter((k) => !used.has(k) && !config.includes(k));
    expect(unused).toEqual([]);
  });
});
