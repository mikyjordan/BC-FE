// Regole condivise per riconoscere il testo visibile scritto direttamente nel codice.
// Usate dal test tests/i18n.test.ts: ogni scritta dell'interfaccia deve stare in src/i18n/it.json.
import fs from 'node:fs';
import path from 'node:path';

/** Attributi JSX tecnici: il loro valore non è testo per l'utente. */
export const TECH_ATTRS = new Set([
  'className', 'key', 'to', 'href', 'src', 'type', 'name', 'id', 'htmlFor', 'role', 'autoComplete', 'inputMode',
  'accept', 'rel', 'target', 'loading', 'method', 'variant', 'tone', 'size', 'align', 'kind', 'feature', 'path',
  'aria-hidden', 'aria-pressed', 'aria-current', 'aria-live', 'aria-describedby', 'aria-labelledby', 'aria-controls',
  'aria-expanded', 'aria-invalid', 'aria-modal', 'aria-busy', 'step', 'min', 'max', 'pattern', 'dir', 'lang',
  'viewBox', 'fill', 'stroke', 'd', 'xmlns', 'strokeWidth', 'strokeLinecap', 'strokeLinejoin', 'gradientUnits',
  'offset', 'stopColor', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'transform', 'mode',
  'dataKey', 'nameKey', 'stackId', 'layout', 'orientation', 'interval', 'tick', 'tone', 'status', 'defaultValue',
  'value', 'tab', 'as', 'color', 'width', 'height', 'textAnchor', 'dominantBaseline', 'fontWeight', 'fontFamily',
  'preserveAspectRatio', 'clipPath', 'mask', 'filter', 'shapeRendering', 'colorInterpolationFilters', 'focusable',
  'enterKeyHint', 'capture', 'decoding', 'referrerPolicy', 'crossOrigin', 'sizes', 'srcSet', 'media', 'form',
]);

/** Chiavi di oggetti e assegnazioni tecniche (header HTTP, chiavi di cache…). */
export const TECH_KEYS = new Set(['Authorization', 'X-Requested-With', 'Content-Type', 'Idempotency-Key', 'Accept', 'credentials', 'method', 'mode', 'cache', 'queryKey', 'mutationKey', 'path', 'to', 'href', 'type', 'id', 'key', 'role', 'permission', 'code', 'dataKey', 'status', 'kind', 'variant', 'tone', 'color', 'fill', 'icon', 'autoComplete', 'inputMode', 'feature', 'contentType', 'scope', 'sort', 'order', 'field', 'format', 'locale', 'timeZone', 'accept', 'sameSite', 'category', 'tab', 'stato', 'tipo']);

const ACCENT = /[À-ÖØ-öø-ÿ’…]/;

/** Attributi JSX / proprietà il cui valore è sempre testo per l'utente. */
export const TEXT_ATTRS = new Set(['label', 'placeholder', 'title', 'alt', 'aria-label', 'hint', 'subtitle', 'description', 'confirmLabel', 'cancelLabel', 'emptyText', 'legend', 'message', 'text', 'caption', 'tooltip', 'heading', 'reason']);

/** Regola larga per i contesti sicuramente visibili (testo JSX, attributi testuali): basta una parola. */
export function isUiText(s) {
  if (typeof s !== 'string') return false;
  const v = s.trim();
  if (!/[A-Za-zÀ-ÿ]{2}/.test(v)) return false;
  if (/^(\/|https?:\/\/[\w.-]+\/?$|mailto:|data:|\.\.?\/|#)/.test(v)) return false;
  if (/^[\w.-]+\.[\w.-]+$/.test(v)) return false; // permessi tipo content.edit
  if (/^[a-z]+[A-Z][A-Za-z]*$/.test(v) || /^[A-Z_]{2,}$/.test(v) && v.length > 3) return false; // camelCase, ENUM
  if (/^[a-z]{2}-[A-Z]{2}$/.test(v)) return false; // locale
  return true;
}

const NON_UI_CALLS = new Set(['register', 'watch', 'setValue', 'getValues', 'trigger', 'resetField', 'setError', 'clearErrors', 'toLocaleString', 'toLocaleDateString', 'NumberFormat', 'DateTimeFormat', 'update', 'setParams', 'navigate', 'can', 'has', 'get', 'toggle', 'mutate', 'mutateAsync', 'fact']);

/** Il letterale sta in un contesto sicuramente visibile? (figlio JSX, attributo testuale, proprietà label/hint…) */
export function inUiContext(node, ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    const child = ancestors[i + 1] ?? node;
    if (a.type === 'JSXSpreadAttribute') return false;
    if ((a.type === 'MemberExpression' || a.type === 'OptionalMemberExpression') && a.object === child) return false;
    if (a.type === 'CallExpression' && NON_UI_CALLS.has(a.callee.type === 'Identifier' ? a.callee.name : a.callee.property?.name)) return false;
    if (a.type === 'ArrowFunctionExpression' || a.type === 'FunctionExpression' || a.type === 'FunctionDeclaration') return false;
    if (a.type === 'JSXAttribute') return TEXT_ATTRS.has(a.name.name);
    if (a.type === 'JSXExpressionContainer') return ancestors[i - 1]?.type === 'JSXElement' || ancestors[i - 1]?.type === 'JSXFragment';
    if (a.type === 'ObjectProperty') {
      const k = a.key.type === 'Identifier' ? a.key.name : a.key.value;
      const direct = child === node || ['ConditionalExpression', 'LogicalExpression', 'TemplateLiteral'].includes(child.type);
      return a.value === child && direct && TEXT_ATTRS.has(k);
    }
    if (a.type === 'MemberExpression' && a.computed && a.property === child) return false;
  }
  return false;
}

/** Euristica: la stringa è testo pensato per essere letto da una persona? */
export function isText(s) {
  if (typeof s !== 'string') return false;
  const v = s.trim();
  if (!/[A-Za-zÀ-ÿ]/.test(v)) return false;
  if (/^(\/|https?:|mailto:|data:|\.\.?\/|#)/.test(v)) return false;
  if (/^[\w.\-:/@]+$/.test(v) && !/^[A-ZÀ-Ý][a-zà-ÿ]/.test(v) && !ACCENT.test(v)) return false; // chiavi, enum, percorsi, id
  if (/^[A-Z][A-Za-z]+\/[A-Z][A-Za-z_]+$/.test(v)) return false; // fusi orari IANA (Europe/Rome)
  if (/^(var\(|rgba?\(|calc\(|linear-gradient|#[0-9a-f]{3,8}\b)/i.test(v)) return false;
  if (/^[\d\s.,]+(px|rem|em|%|vh|vw|ms|s|fr)(\s|$)/.test(v)) return false; // misure CSS
  if (ACCENT.test(v)) return true;
  if (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(v)) return true; // "Portafoglio", "Film in evidenza"
  if (/[a-zà-ÿ]{2,}\s+[a-zà-ÿ]{2,}/i.test(v)) return true; // più parole
  return false;
}

const SKIP_CALLEES = new Set(['console', 'require', 'import', 'useQuery', 'queryKey', 'invalidateQueries', 'setQueryData', 'getQueryData', 'matchMedia', 'querySelector', 'addEventListener', 'removeEventListener', 'getItem', 'setItem', 'removeItem', 'get', 'set', 'has', 'startsWith', 'endsWith', 'includes', 'split', 'replace', 'join', 'padStart', 'createElement', 'getElementById', 'styled', 'css', 'keyframes', 'createGlobalStyle', 't', 'tx', 'tList', 'lazy']);

function calleeName(c) {
  if (!c) return null;
  if (c.type === 'Identifier') return c.name;
  if (c.type === 'MemberExpression') return c.property?.name ?? null;
  return null;
}

/** Contesti in cui una stringa è tecnica anche se "sembra" testo. */
export function shouldSkipLiteral(node, ancestors) {
  const parent = ancestors[ancestors.length - 1];
  if (!parent) return true;
  for (const a of ancestors) {
    if (a.type === 'TaggedTemplateExpression') return true; // styled-components / css
    if (a.type === 'ImportDeclaration' || a.type === 'ExportNamedDeclaration' && a.source || a.type === 'ExportAllDeclaration') return true;
    if (a.type?.startsWith('TS') && a.type !== 'TSAsExpression' && a.type !== 'TSNonNullExpression' && a.type !== 'TSSatisfiesExpression') return true;
    if (a.type === 'JSXAttribute' && (a.name.name === 'style' || a.name.name === 'className')) return true;
  }
  if (parent.type === 'ObjectProperty' && parent.key === node && !parent.computed) return true;
  const keyName = (k) => (k?.type === 'Identifier' ? k.name : k?.type === 'StringLiteral' ? k.value : null);
  if (parent.type === 'ObjectProperty' && parent.value === node && TECH_KEYS.has(keyName(parent.key))) return true;
  if (parent.type === 'AssignmentExpression' && parent.right === node && parent.left.type === 'MemberExpression' && TECH_KEYS.has(keyName(parent.left.property))) return true;
  if (parent.type === 'ObjectMethod' && parent.key === node) return true;
  if (parent.type === 'ClassProperty' && parent.key === node) return true;
  if (parent.type === 'BinaryExpression' && ['===', '!==', '==', '!=', 'in'].includes(parent.operator)) return true;
  if (parent.type === 'SwitchCase') return true;
  if (parent.type === 'MemberExpression' && parent.property === node) return true;
  if (parent.type === 'Directive' || parent.type === 'DirectiveLiteral') return true;
  if ((parent.type === 'CallExpression' || parent.type === 'NewExpression') && SKIP_CALLEES.has(calleeName(parent.callee))) return true;
  if (parent.type === 'CallExpression' && parent.callee.type === 'MemberExpression' && parent.callee.object?.name === 'console') return true;
  return false;
}

/** Visita l'AST passando gli antenati. */
export function walk(node, fn, ancestors = []) {
  if (!node || typeof node.type !== 'string') return;
  fn(node, ancestors);
  const next = [...ancestors, node];
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'range' || key === 'leadingComments' || key === 'trailingComments' || key === 'extra') continue;
    const v = node[key];
    if (Array.isArray(v)) for (const c of v) { if (c && typeof c.type === 'string') walk(c, fn, next); }
    else if (v && typeof v.type === 'string') walk(v, fn, next);
  }
}

/** File sorgente dell'interfaccia da controllare (i18n, tema e tipi esclusi). */
export function files(srcDir) {
  const out = [];
  const visit = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['i18n', 'theme'].includes(e.name)) visit(p); continue; }
      if (!/\.(tsx?|mjs)$/.test(e.name) || e.name.endsWith('.d.ts')) continue;
      if (p.endsWith(path.join('api', 'types.ts'))) continue;
      out.push(p);
    }
  };
  visit(srcDir);
  return out.sort();
}

/**
 * Scritte fisse in un sorgente: testo JSX, attributi testuali, stringhe che sembrano testo.
 * Restituisce [{ line, text }].
 */
export function findHardcoded(code, parse) {
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const found = [];
  walk(ast, (node, ancestors) => {
    if (node.type === 'JSXText') {
      if (isUiText(node.value)) found.push({ line: node.loc.start.line, text: node.value.trim() });
      return;
    }
    if (node.type !== 'StringLiteral' && node.type !== 'TemplateLiteral') return;
    if (shouldSkipLiteral(node, ancestors)) return;
    const parent = ancestors[ancestors.length - 1];
    if (parent?.type === 'JSXAttribute') {
      const name = parent.name.name;
      if (TECH_ATTRS.has(name) || String(name).startsWith('data-') || String(name).startsWith('$')) return;
    }
    const value = node.type === 'StringLiteral' ? node.value : node.quasis.map((q) => q.value.cooked).join(' ');
    if (isText(value) || (inUiContext(node, ancestors) && isUiText(value))) found.push({ line: node.loc.start.line, text: value });
  });
  return found;
}

/** Chiamate t()/tx()/tList() con chiave letterale e nomi dei parametri passati. */
export function findTranslationCalls(code, parse) {
  const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const calls = [];
  walk(ast, (node) => {
    if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier' || !['t', 'tx', 'tList'].includes(node.callee.name)) return;
    const [key, params] = node.arguments;
    if (key?.type !== 'StringLiteral') { calls.push({ line: node.loc.start.line, key: null }); return; }
    const names = params?.type === 'ObjectExpression'
      ? params.properties.filter((p) => p.type === 'ObjectProperty').map((p) => (p.key.type === 'Identifier' ? p.key.name : p.key.value))
      : null;
    calls.push({ line: node.loc.start.line, key: key.value, params: names });
  });
  return calls;
}
