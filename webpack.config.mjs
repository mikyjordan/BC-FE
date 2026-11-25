/**
 * Build del frontend (React) senza Vite.
 *
 *   npm start                 → server di sviluppo su http://localhost:4000 (con proxy verso l'API)
 *   npm run build             → build di produzione nella cartella build/
 *   GENERATE_SOURCEMAP=false  → build senza source map
 *   REACT_APP_API_URL         → indirizzo dell'API usato dalla build (es. https://api.miosito.it);
 *                               se vuoto, la build usa lo stesso host della pagina sulla porta 4000
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import { GenerateSW } from "workbox-webpack-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));
// Nome, descrizione e lingua dell'app vengono dal file dei testi (src/i18n/it.json).
const texts = JSON.parse(readFileSync(path.join(root, "src/i18n/it.json"), "utf8"));
const appMeta = texts.app.meta;
const API_TARGET = process.env.API_PROXY ?? "http://localhost:4001";

const manifest = {
  name: appMeta.name,
  short_name: appMeta.shortName,
  description: appMeta.description,
  lang: texts.meta.lang,
  start_url: "/app",
  scope: "/",
  display: "standalone",
  background_color: "#F2F2F2",
  theme_color: "#1A7CB6",
  icons: [
    { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
    { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

/** Variabili REACT_APP_* rese disponibili al codice come process.env.REACT_APP_* (lette alla build). */
const reactAppEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("REACT_APP_")));

export default (_env, argv) => {
  const production = argv.mode !== "development";
  const sourceMap = process.env.GENERATE_SOURCEMAP !== "false";
  return {
    mode: production ? "production" : "development",
    entry: path.join(root, "src/main.tsx"),
    output: {
      path: path.join(root, "build"),
      publicPath: "/",
      filename: production ? "static/js/[name].[contenthash:8].js" : "static/js/[name].js",
      chunkFilename: production ? "static/js/[name].[contenthash:8].chunk.js" : "static/js/[name].chunk.js",
      clean: true,
    },
    devtool: production ? (sourceMap ? "source-map" : false) : "eval-cheap-module-source-map",
    resolve: {
      extensions: [".tsx", ".ts", ".js", ".mjs", ".json"],
      // gli import in stile TypeScript con estensione .js puntano ai sorgenti .ts/.tsx
      extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
    },
    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          exclude: /node_modules/,
          use: { loader: "babel-loader", options: { cacheDirectory: true, envName: production ? "production" : "development" } },
        },
        { test: /\.(png|jpe?g|gif|webp|svg|woff2?)$/i, type: "asset/resource", generator: { filename: "static/media/[name].[hash:8][ext]" } },
      ],
    },
    plugins: [
      // Nel browser non esiste `process`: come in Create React App, process.env diventa un oggetto
      // con NODE_ENV e le sole variabili REACT_APP_* (nessun altro segreto finisce nella build).
      new webpack.DefinePlugin({
        "process.env": JSON.stringify({ ...reactAppEnv, NODE_ENV: production ? "production" : "development" }),
      }),
      new HtmlWebpackPlugin({
        template: path.join(root, "public/index.html"),
        templateParameters: { lang: texts.meta.lang, appName: appMeta.name, pageDescription: appMeta.pageDescription },
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: path.join(root, "public"), globOptions: { ignore: ["**/index.html"] } }],
      }),
      // Il manifest della PWA viene generato con i testi del file it.json.
      {
        apply(compiler) {
          compiler.hooks.thisCompilation.tap("BusterCinemaManifest", (compilation) => {
            compilation.hooks.processAssets.tap({ name: "BusterCinemaManifest", stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, () => {
              compilation.emitAsset("manifest.webmanifest", new webpack.sources.RawSource(JSON.stringify(manifest, null, 2)));
            });
          });
        },
      },
      ...(production
        ? [
            new GenerateSW({
              swDest: "sw.js",
              clientsClaim: true,
              skipWaiting: true,
              // Solo lo "shell" statico viene messo in cache. Le API (dati economici, saldi,
              // profili) non vengono MAI salvate offline: sempre e solo dalla rete.
              include: [/\.(js|css|html|svg|png|woff2|webmanifest)$/],
              exclude: [/\.map$/, /asset-manifest\.json$/],
              navigateFallback: "/index.html",
              navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/health/],
              runtimeCaching: [{ urlPattern: ({ url }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" }],
              maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
              sourcemap: sourceMap,
            }),
          ]
        : []),
    ],
    performance: { hints: false },
    devServer: {
      port: Number(process.env.PORT ?? 4000),
      host: process.env.HOST ?? "localhost",
      historyApiFallback: true,
      hot: true,
      // Indirizzi pubblici accettati oltre a localhost: i tunnel di VS Code per provare dal cellulare.
      allowedHosts: ["localhost", ".devtunnels.ms", ".local"],
      static: { directory: path.join(root, "public"), publicPath: "/" },
      proxy: [{ context: ["/api", "/uploads"], target: API_TARGET, changeOrigin: false }],
      client: { overlay: { errors: true, warnings: false } },
    },
  };
};
