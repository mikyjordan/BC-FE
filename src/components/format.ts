import { LOCALE, t } from '../i18n';
import { ITALY_TIME_ZONE } from './time';

const nf = new Intl.NumberFormat(LOCALE);
const df = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', timeZone: ITALY_TIME_ZONE });
const tf = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', timeZone: ITALY_TIME_ZONE });
const dtf = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: ITALY_TIME_ZONE });

export const formatNumber = (n: number) => nf.format(n);
/** Importo Bustercoin, con segno opzionale per i movimenti. */
export const formatBc = (n: number, signed = false) => t('components.format.importoBc', { sign: signed && n > 0 ? '+' : '', amount: nf.format(n) });
export const formatPct = (n: number) => t('components.format.percentuale', { sign: n > 0 ? '+' : '', value: n.toLocaleString(LOCALE, { maximumFractionDigits: 2 }) });
export const formatDate = (d: string | null | undefined) => (d ? df.format(new Date(d)) : '—');
/** Solo l'ora, "HH:MM" in ora italiana. */
export const formatTime = (d: string | null | undefined) => (d ? tf.format(new Date(d)) : '—');
export const formatDateTime = (d: string | null | undefined) => (d ? dtf.format(new Date(d)) : '—');

export const LEDGER_LABELS: Record<string, string> = {
  INITIAL_BONUS: t('components.format.bonusDiBenvenuto'),
  WEEKLY_BONUS: t('components.format.bonusSettimanale'),
  MOVIE_PURCHASE: t('components.format.acquistoFilm'),
  TV_SERIES_PURCHASE: t('components.format.acquistoSerieTv'),
  BOX_OFFICE_REWARD: t('components.format.riscattoFilm'),
  TV_SERIES_REWARD: t('components.format.rendimentoSerieTv'),
  COIN_PURCHASE: t('components.format.acquistoBustercoin'),
  PROMOTIONAL_BONUS: t('components.format.bonusPromozionale'),
  COMPETITION_REWARD: t('components.format.premioCompetizione'),
  ADMIN_ADJUSTMENT: t('components.format.rettifica'),
  REFUND: t('components.format.rimborso'),
  OTHER_REWARD: t('components.format.altroPremio'),
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: t('components.format.bozza'),
  PUBLISHED: t('components.format.pubblicato'),
  HIDDEN: t('components.format.nascosto'),
  ARCHIVED: t('components.format.archiviato'),
};
