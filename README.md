# BusterCinema — frontend (BC-FE)

Sito/PWA di BusterCinema in React (webpack, senza Vite). Il backend è nel repository **BC-BE**.

## Avvio

```bash
npm install
npm run dev           # server: build di produzione + avvio/riavvio con pm2 (processo PGFE) + log
npm start             # sviluppo su http://localhost:3000 (le chiamate /api vanno al backend)
npm run start:rete    # sviluppo raggiungibile da altri dispositivi della rete
npm run build         # solo build di produzione nella cartella build/
```

`npm run dev` usa `pm2 startOrRestart pm2.config.cjs`: se PGFE è già acceso viene riavviato con la
nuova build, non se ne crea mai un secondo e non serve cancellarlo. Funziona anche su Windows.
Con Ctrl+C si chiudono solo i log: il sito resta acceso.

## Porta del sito e indirizzo del backend — `api.config.json`

```json
{ "apiUrl": "", "apiPort": 4000, "sitePort": 3000 }
```

- `sitePort`: porta su cui pm2 serve il sito (`npm run dev`).
- `apiUrl` vuoto: il sito chiama lo **stesso host** da cui viene aperto, sulla porta `apiPort`
  (backend e frontend sullo stesso server).
- `apiUrl` pieno (es. `http://192.168.1.50:4001`): backend su un altro server.
- Il file viene letto alla build: dopo una modifica va rifatto `npm run build`.
- Le variabili `REACT_APP_API_URL` / `REACT_APP_API_PORT`, se impostate, hanno la precedenza.
- Le porte del sito e del backend devono essere aperte nel firewall del server.

## Colori — `src/theme/colors.config.json`

Tutti i colori del sito sono in questo file (colori di **default**); nei componenti si usa sempre
`theme.colors.<nome>`, mai un colore scritto direttamente.

Il Superadmin li può cambiare da **Area admin → Impostazioni → Colori del sito**:
- le modifiche si vedono subito in anteprima solo per chi modifica;
- con **Salva colori** diventano visibili a tutti (il backend salva solo i colori diversi dal default);
- con **Ripristina colori di default** si torna ai valori di questo file.

Per aggiungere un colore: aggiungilo a `colors.config.json`, poi in `ThemeColorsCard.tsx`
(`colorGroups`) con il suo nome in `src/i18n/it.json`. Un test controlla che il pannello li elenchi tutti.

## Pagine

- `/` pagina iniziale pubblica: spiega cosa si può fare (bonus, acquisto film, incassi, riscatto,
  serie TV se attive, portafoglio, classifiche in arrivo) e mostra i titoli in vetrina senza poterli
  comprare; chi ha già una sessione va direttamente in `/app`.
- `/login`, `/registrazione`, `/come-funziona`, `/termini`, `/privacy`: pubbliche.
- `/app/...`: area utente; `/admin/...`: area amministrativa.

## Test

```bash
npm test          # unit (Jest)
npm run e2e       # end-to-end (Playwright): backend in ../BC-BE oppure E2E_BACKEND_DIR
```
