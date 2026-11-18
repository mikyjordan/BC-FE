/**
 * Ora usata dal sito per le regole visibili (scadenze, stato dei film, controlli dei moduli).
 * Normalmente è l'ora del dispositivo; con l'orologio simulato del backend (solo sviluppo) è
 * la data simulata, ricavata da GET /clock (vedi SimulatedClockBanner).
 */
let offsetMs = 0;

export const appNowMs = () => Date.now() + offsetMs;
export const appNow = () => new Date(appNowMs());

/** Allinea il sito alla data del server (solo se simulata). */
export function syncServerClock(serverNowIso: string, simulated: boolean): void {
  offsetMs = simulated ? Date.parse(serverNowIso) - Date.now() : 0;
}
