/**
 * Build del frontend (React) senza Vite.
 *
 *   npm start                 → server di sviluppo su http://localhost:3000 (con proxy verso l'API)
 *   npm run build             → build di produzione nella cartella build/
 *   GENERATE_SOURCEMAP=false  → build senza source map (oppure: webpack --env nosourcemap, vale anche su Windows)
 *
 * Indirizzo dell'API (backend): si imposta nel file api.config.json, nella cartella del progetto:
 *   "apiUrl"  → indirizzo completo del backend, es. "http://192.168.1.50:4001" (backend su un altro server)
 *   "apiPort" → se apiUrl è vuoto: stesso host della pagina, su questa porta (es. 4001)
 * Le variabili REACT_APP_API_URL / REACT_APP_API_PORT, se presenti, hanno la precedenza sul file.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { GenerateSW } from 'workbox-webpack-plugin';

const root = path.dirname(fileURLToPath(import.meta.url));
// Nome, descrizione e lingua dell'app vengono dal file dei testi (src/i18n/it.json).
const texts = JSON.parse(readFileSync(path.join(root, 'src/i18n/it.json'), 'utf8'));
const appMeta = texts.app.meta;
// Colori di default del sito (gli stessi del tema): barra del browser e schermata di avvio della PWA.
const defaultColors = JSON.parse(readFileSync(path.join(root, 'src/theme/colors.config.json'), 'utf8'));
// Indirizzo del backend dichiarato nel progetto (api.config.json); dopo una modifica va rifatta la build.
const apiConfig = JSON.parse(readFileSync(path.join(root, 'api.config.json'), 'utf8'));
const API_URL = String(process.env.REACT_APP_API_URL || apiConfig.apiUrl || '').trim().replace(/\/+$/, '');
const API_PORT = String(process.env.REACT_APP_API_PORT || apiConfig.apiPort || 4000);
// Server di sviluppo: le chiamate /api vanno al backend indicato (o a localhost sulla porta indicata).
const API_TARGET = process.env.API_PROXY ?? (API_URL || `http://localhost:${API_PORT}`);

const manifest = {
  name: appMeta.name,
  short_name: appMeta.shortName,
  description: appMeta.description,
  lang: texts.meta.lang,
  start_url: '/app',
  scope: '/',
  display: 'standalone',
  background_color: defaultColors.bg,
  theme_color: defaultColors.brand,
  icons: [
    { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

/** Variabili REACT_APP_* rese disponibili al codice come process.env.REACT_APP_* (lette alla build). */
const reactAppEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('REACT_APP_')));

export default (env, argv) => {
  const production = argv.mode !== 'development';
  const sourceMap = process.env.GENERATE_SOURCEMAP !== 'false' && !env?.nosourcemap;
  return {
    mode: production ? 'production' : 'development',
    entry: path.join(root, 'src/main.tsx'),
    output: {
      path: path.join(root, 'build'),
      publicPath: '/',
      filename: production ? 'static/js/[name].[contenthash:8].js' : 'static/js/[name].js',
      chunkFilename: production ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js',
      clean: true,
    },
    devtool: production ? (sourceMap ? 'source-map' : false) : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.mjs', '.json'],
      // gli import in stile TypeScript con estensione .js puntano ai sorgenti .ts/.tsx
      extensionAlias: { '.js': ['.ts', '.tsx', '.js'] },
    },
    module: {
      rules: [
        { test: /\.[cm]?[jt]sx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { cacheDirectory: true, envName: production ? 'production' : 'development' } } },
        { test: /\.(png|jpe?g|gif|webp|svg|woff2?)$/i, type: 'asset/resource', generator: { filename: 'static/media/[name].[hash:8][ext]' } },
      ],
    },
    plugins: [
      // Nel browser non esiste `process`: come in Create React App, process.env diventa un oggetto
      // con NODE_ENV e le sole variabili REACT_APP_* (nessun altro segreto finisce nella build).
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({ ...reactAppEnv, REACT_APP_API_URL: API_URL, REACT_APP_API_PORT: API_PORT, NODE_ENV: production ? 'production' : 'development' }),
      }),
      new HtmlWebpackPlugin({
        template: path.join(root, 'public/index.html'),
        templateParameters: { themeColor: defaultColors.brand, lang: texts.meta.lang, appName: appMeta.name, pageDescription: appMeta.pageDescription },
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: path.join(root, 'public'), globOptions: { ignore: ['**/index.html'] } }],
      }),
      // Il manifest della PWA viene generato con i testi del file it.json.
      {
        apply(compiler) {
          compiler.hooks.thisCompilation.tap('BusterCinemaManifest', (compilation) => {
            compilation.hooks.processAssets.tap({ name: 'BusterCinemaManifest', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, () => {
              compilation.emitAsset('manifest.webmanifest', new webpack.sources.RawSource(JSON.stringify(manifest, null, 2)));
            });
          });
        },
      },
      ...(production
        ? [
            new GenerateSW({
              swDest: 'sw.js',
              clientsClaim: true,
              skipWaiting: true,
              // Solo lo "shell" statico viene messo in cache. Le API (dati economici, saldi,
              // profili) non vengono MAI salvate offline: sempre e solo dalla rete.
              include: [/\.(js|css|html|svg|png|woff2|webmanifest)$/],
              exclude: [/\.map$/, /asset-manifest\.json$/],
              navigateFallback: '/index.html',
              navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/health/],
              runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' }],
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
              sourcemap: sourceMap,
            }),
          ]
        : []),
    ],
    performance: { hints: false },
    devServer: {
      port: Number(process.env.PORT ?? 3000),
      host: process.env.HOST ?? 'localhost',
      historyApiFallback: true,
      hot: true,
      // Indirizzi pubblici accettati oltre a localhost: i tunnel di VS Code per provare dal cellulare.
      allowedHosts: ['localhost', '.devtunnels.ms', '.local'],
      static: { directory: path.join(root, 'public'), publicPath: '/' },
      proxy: [{ context: ['/api', '/uploads'], target: API_TARGET, changeOrigin: false }],
      client: { overlay: { errors: true, warnings: false } },
    },
  };
};
