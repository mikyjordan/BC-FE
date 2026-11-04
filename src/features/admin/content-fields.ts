import type { AdminContent, ContentKindPath } from '../../api/types';

export type FieldType = 'text' | 'textarea' | 'list' | 'int' | 'date' | 'select';

export interface FieldDef {
  name: keyof AdminContent & string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  options?: Array<[string, string]>;
  wide?: boolean;
}

const common = {
  title: { name: 'title', label: 'Titolo', type: 'text', required: true },
  originalTitle: { name: 'originalTitle', label: 'Titolo originale', type: 'text' },
  posterUrl: { name: 'posterUrl', label: 'URL locandina', type: 'text', hint: 'https://… (immagine verticale)' },
  coverUrl: { name: 'coverUrl', label: 'URL immagine di copertina', type: 'text', hint: 'https://… (immagine orizzontale)' },
  description: { name: 'description', label: 'Descrizione', type: 'textarea', wide: true },
  genres: { name: 'genres', label: 'Generi', type: 'list', hint: 'Separati da virgola' },
  castMembers: { name: 'castMembers', label: 'Cast', type: 'list', hint: 'Separati da virgola', wide: true },
  productionCountry: { name: 'productionCountry', label: 'Paese di produzione', type: 'text' },
  adminNotes: { name: 'adminNotes', label: 'Note amministrative (mai pubbliche)', type: 'textarea', wide: true },
} satisfies Record<string, FieldDef>;

export const FIELDS: Record<ContentKindPath, FieldDef[]> = {
  movies: [
    common.title,
    common.originalTitle,
    common.posterUrl,
    common.coverUrl,
    common.description,
    { name: 'plot', label: 'Trama', type: 'textarea', wide: true },
    common.genres,
    { name: 'director', label: 'Regista', type: 'text' },
    common.castMembers,
    { name: 'durationMinutes', label: 'Durata (minuti)', type: 'int' },
    { name: 'italianReleaseDate', label: 'Uscita italiana', type: 'date' },
    { name: 'screeningStartDate', label: 'Inizio programmazione', type: 'date' },
    { name: 'screeningEndDate', label: 'Fine programmazione', type: 'date' },
    common.productionCountry,
    { name: 'distributor', label: 'Distribuzione', type: 'text' },
    { name: 'ageRating', label: 'Classificazione', type: 'text' },
    common.adminNotes,
  ],
  'tv-series': [
    common.title,
    common.originalTitle,
    common.posterUrl,
    common.coverUrl,
    common.description,
    common.genres,
    { name: 'creator', label: 'Creatore', type: 'text' },
    common.castMembers,
    { name: 'platforms', label: 'Piattaforme / canali', type: 'list', hint: 'Separati da virgola' },
    { name: 'firstReleaseDate', label: 'Prima pubblicazione', type: 'date' },
    {
      name: 'seriesStatus',
      label: 'Stato della serie',
      type: 'select',
      options: [
        ['ONGOING', 'In corso'],
        ['ANNOUNCED', 'Annunciata'],
        ['ENDED', 'Conclusa'],
        ['CANCELLED', 'Cancellata'],
      ],
    },
    { name: 'seasonsCount', label: 'Numero di stagioni', type: 'int' },
    { name: 'episodesCount', label: 'Numero di episodi', type: 'int' },
    {
      name: 'holdingScope',
      label: 'Partecipazione su',
      type: 'select',
      options: [
        ['SERIES', 'Intera serie'],
        ['SEASON', 'Singola stagione'],
      ],
    },
    common.productionCountry,
    { name: 'dataSource', label: 'Fonte dei dati', type: 'text', hint: 'Es. Auditel, inserimento manuale' },
    common.adminNotes,
  ],
};

export type FormValues = Record<string, string>;

export function toFormValues(kind: ContentKindPath, item?: AdminContent): FormValues {
  const values: FormValues = {};
  for (const f of FIELDS[kind]) {
    const v = item?.[f.name];
    if (Array.isArray(v)) values[f.name] = v.join(', ');
    else if (v === null || v === undefined) values[f.name] = f.type === 'select' ? (f.options?.[0]?.[0] ?? '') : '';
    else values[f.name] = String(v);
  }
  return values;
}

/** Converte i valori del form nel payload atteso dal backend (stringhe vuote → null). */
export function toPayload(kind: ContentKindPath, values: FormValues) {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS[kind]) {
    const raw = (values[f.name] ?? '').trim();
    switch (f.type) {
      case 'list':
        out[f.name] = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
        break;
      case 'int':
        out[f.name] = raw === '' ? null : Number.parseInt(raw, 10);
        break;
      case 'select':
        out[f.name] = raw;
        break;
      default:
        out[f.name] = raw === '' ? (f.required ? '' : null) : raw;
    }
  }
  return out;
}

/** ISO → valore per <input type="datetime-local"> nel fuso del browser. */
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
