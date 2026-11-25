import { appNow } from './clock';

/**
 * Ora italiana nel frontend. Date e orari si mostrano e si inseriscono SEMPRE in ora italiana
 * (Europe/Rome), anche se il PC o il telefono hanno un altro fuso orario: "23:59" in un campo
 * dell'area admin significa le 23:59 in Italia.
 */
export const ITALY_TIME_ZONE = 'Europe/Rome';

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: ITALY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function italyParts(ms: number) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** Differenza (ms) tra l'ora italiana e UTC in un dato istante: +1h d'inverno, +2h d'estate. */
function italyOffset(ms: number): number {
  const p = italyParts(ms);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Anni accettati nei campi data: fuori da questo intervallo la data è considerata non valida. */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;
export const MIN_DATE = `${MIN_YEAR}-01-01`;
export const MAX_DATE = `${MAX_YEAR}-12-31`;

/**
 * "AAAA-MM-GG" valida: formato esatto, giorno esistente nel calendario (niente 31 aprile o
 * 30 febbraio) e anno tra MIN_YEAR e MAX_YEAR. Il browser può passare valori come "20266-11-06"
 * se si digita un anno troppo lungo.
 */
export function isValidDate(value: string | null | undefined): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < MIN_YEAR || y > MAX_YEAR) return false;
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** "AAAA-MM-GGTHH:MM" valida (data come isValidDate, ora 00:00–23:59). */
export function isValidDateTime(value: string | null | undefined): boolean {
  const [date, time] = (value ?? '').split('T');
  return isValidDate(date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(time ?? '');
}

/** Istante → "AAAA-MM-GGTHH:MM" in ora italiana (valore per i campi data/ora). */
export function toItalyInput(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const p = italyParts(ms);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** "AAAA-MM-GGTHH:MM" letto come ora italiana → istante ISO (UTC). */
export function fromItalyInput(value: string): string | null {
  if (!value) return null;
  const [date, time = '00:00'] = value.split('T');
  // Data o ora non valide: nessun istante (chi chiama lo segnala come errore del campo).
  if (!isValidDateTime(`${date}T${time}`)) return null;
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  // primo tentativo con l'offset di quel momento, poi correzione vicino al cambio d'ora
  let ms = wall - italyOffset(wall);
  const corrected = wall - italyOffset(ms);
  if (corrected !== ms) ms = corrected;
  return new Date(ms).toISOString();
}

/** Giorno di calendario in Italia, "AAAA-MM-GG". */
export const italyToday = (now: Date = appNow()) => toItalyInput(now).slice(0, 10);

/** Aggiunge giorni a una data "AAAA-MM-GG" (calendario puro, senza fusi). */
export function addDays(date: string, days: number): string {
  if (!isValidDate(date)) return '';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
