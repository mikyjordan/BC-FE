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

/** Istante → "AAAA-MM-GGTHH:MM" in ora italiana (valore per i campi data/ora). */
export function toItalyInput(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const p = italyParts(new Date(iso).getTime());
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}

/** "AAAA-MM-GGTHH:MM" letto come ora italiana → istante ISO (UTC). */
export function fromItalyInput(value: string): string | null {
  if (!value) return null;
  const [date, time = '00:00'] = value.split('T');
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
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
