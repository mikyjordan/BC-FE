import { fromItalyInput, toItalyInput } from '../../components/time';
import type { AdminContent, ContentKindPath } from '../../api/types';
import { t } from '../../i18n';

export type FieldType = 'text' | 'textarea' | 'list' | 'int' | 'date' | 'select' | 'image';

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
  title: { name: 'title', label: t('admin.contentFields.titolo'), type: 'text', required: true },
  originalTitle: { name: 'originalTitle', label: t('admin.contentFields.titoloOriginale'), type: 'text' },
  posterUrl: { name: 'posterUrl', label: t('admin.contentFields.locandina'), type: 'image', wide: true, hint: t('admin.contentFields.caricaUnImmagineDalComputer') },
  coverUrl: { name: 'coverUrl', label: t('admin.contentFields.urlImmagineDiCopertina'), type: 'text', hint: t('admin.contentFields.httpsImmagineOrizzontale') },
  description: { name: 'description', label: t('admin.contentFields.descrizione'), type: 'textarea', wide: true },
  genres: { name: 'genres', label: t('admin.contentFields.generi'), type: 'list', hint: t('admin.contentFields.separatiDaVirgola') },
  castMembers: { name: 'castMembers', label: t('admin.contentFields.cast'), type: 'list', hint: t('admin.contentFields.separatiDaVirgola'), wide: true },
  productionCountry: { name: 'productionCountry', label: t('admin.contentFields.paeseDiProduzione'), type: 'text' },
  adminNotes: { name: 'adminNotes', label: t('admin.contentFields.noteAmministrativeMaiPubbliche'), type: 'textarea', wide: true },
} satisfies Record<string, FieldDef>;

export const FIELDS: Record<ContentKindPath, FieldDef[]> = {
  // Film: niente titolo originale, immagine di copertina e descrizione (la scheda usa la trama).
  movies: [
    common.title,
    common.posterUrl,
    { name: 'plot', label: t('admin.contentFields.trama'), type: 'textarea', wide: true },
    common.genres,
    { name: 'director', label: t('admin.contentFields.regista'), type: 'text' },
    common.castMembers,
    { name: 'durationMinutes', label: t('admin.contentFields.durataMinuti'), type: 'int' },
    common.productionCountry,
    { name: 'distributor', label: t('admin.contentFields.distribuzione'), type: 'text' },
    { name: 'ageRating', label: t('admin.contentFields.classificazione'), type: 'text' },
    common.adminNotes,
  ],
  'tv-series': [
    common.title,
    common.originalTitle,
    common.posterUrl,
    common.coverUrl,
    common.description,
    common.genres,
    { name: 'creator', label: t('admin.contentFields.creatore'), type: 'text' },
    common.castMembers,
    { name: 'platforms', label: t('admin.contentFields.piattaformeCanali'), type: 'list', hint: t('admin.contentFields.separatiDaVirgola') },
    { name: 'firstReleaseDate', label: t('admin.contentFields.primaPubblicazione'), type: 'date' },
    {
      name: 'seriesStatus',
      label: t('admin.contentFields.statoDellaSerie'),
      type: 'select',
      options: [
        ['ONGOING', t('admin.contentFields.inCorso')],
        ['ANNOUNCED', t('admin.contentFields.annunciata')],
        ['ENDED', t('admin.contentFields.conclusa')],
        ['CANCELLED', t('admin.contentFields.cancellata')],
      ],
    },
    { name: 'seasonsCount', label: t('admin.contentFields.numeroDiStagioni'), type: 'int' },
    { name: 'episodesCount', label: t('admin.contentFields.numeroDiEpisodi'), type: 'int' },
    {
      name: 'holdingScope',
      label: t('admin.contentFields.partecipazioneSu'),
      type: 'select',
      options: [
        ['SERIES', t('admin.contentFields.interaSerie')],
        ['SEASON', t('admin.contentFields.singolaStagione')],
      ],
    },
    common.productionCountry,
    { name: 'dataSource', label: t('admin.contentFields.fonteDeiDati'), type: 'text', hint: t('admin.contentFields.esAuditelInserimentoManuale') },
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
/** Valore per i campi data/ora: sempre in ora italiana, qualunque sia il fuso del dispositivo. */
export const toLocalInput = (iso: string | null | undefined) => toItalyInput(iso);
/** Il valore del campo è inteso come ora italiana. */
export const fromLocalInput = (v: string) => fromItalyInput(v);
