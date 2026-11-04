const nf = new Intl.NumberFormat('it-IT');
const df = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
const dtf = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const formatNumber = (n: number) => nf.format(n);
/** Importo Bustercoin, con segno opzionale per i movimenti. */
export const formatBc = (n: number, signed = false) => `${signed && n > 0 ? '+' : ''}${nf.format(n)} B`;
export const formatPct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('it-IT', { maximumFractionDigits: 2 })}%`;
export const formatDate = (d: string | null | undefined) => (d ? df.format(new Date(d)) : '—');
export const formatDateTime = (d: string | null | undefined) => (d ? dtf.format(new Date(d)) : '—');

export const LEDGER_LABELS: Record<string, string> = {
  INITIAL_BONUS: 'Bonus di benvenuto',
  WEEKLY_BONUS: 'Bonus settimanale',
  MOVIE_PURCHASE: 'Acquisto film',
  TV_SERIES_PURCHASE: 'Acquisto serie TV',
  BOX_OFFICE_REWARD: 'Rendimento Box Office',
  TV_SERIES_REWARD: 'Rendimento serie TV',
  COIN_PURCHASE: 'Acquisto Bustercoin',
  PROMOTIONAL_BONUS: 'Bonus promozionale',
  COMPETITION_REWARD: 'Premio competizione',
  ADMIN_ADJUSTMENT: 'Rettifica',
  REFUND: 'Rimborso',
  OTHER_REWARD: 'Altro premio',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bozza',
  PUBLISHED: 'Pubblicato',
  HIDDEN: 'Nascosto',
  ARCHIVED: 'Archiviato',
};
