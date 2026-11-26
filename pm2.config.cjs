/**
 * pm2 per il sito (processo BCFE): serve la cartella build/ come SPA.
 *
 *   npm run dev   → build di produzione + avvio con pm2; se BCFE è già acceso viene RIAVVIATO
 *                   (pm2 startOrRestart): non si crea mai un secondo processo, non serve cancellarlo.
 *
 * La porta del sito si imposta in api.config.json ("sitePort"), insieme all'indirizzo del backend.
 */
const path = require("node:path");
const config = require("./api.config.json");

const port = Number(config.sitePort) || 3000;

module.exports = {
  apps: [
    {
      name: "BCFE",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules/serve/build/main.js"),
      args: ["-s", "build", "-l", String(port)],
      autorestart: true,
    },
  ],
};
