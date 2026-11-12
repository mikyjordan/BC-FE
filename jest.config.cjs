/** Test unitari del frontend (Jest + Testing Library). Gli end-to-end sono in e2e/ (Playwright). */
module.exports = {
  testEnvironment: '<rootDir>/tests/jsdom-environment.cjs',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // I test girano come moduli ES (come il codice e come react-router, pubblicato solo in ESM):
  // `npm test` avvia Jest con --experimental-vm-modules.
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: { '^.+\\.(m?js|tsx?)$': 'babel-jest' },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'json'],
  moduleNameMapper: {
    '^styled-components$': '<rootDir>/tests/shims/styled-components.mjs',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
