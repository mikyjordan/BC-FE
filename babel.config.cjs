/**
 * Babel compila TypeScript e JSX per il browser (webpack) e per i test (Jest).
 * Il controllo dei tipi è separato: `npm run typecheck` (tsc).
 */
module.exports = (api) => {
  const isTest = api.env('test');
  return {
    presets: [
      ['@babel/preset-env', isTest ? { targets: { node: 'current' } } : { targets: 'defaults' }],
      ['@babel/preset-react', { runtime: 'automatic', development: api.env('development') }],
      ['@babel/preset-typescript', { onlyRemoveTypeImports: true }],
    ],
  };
};
