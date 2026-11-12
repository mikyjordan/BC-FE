/**
 * Ambiente jsdom con le API web di Node che jsdom non ha (fetch, Request, Response,
 * TextEncoder…), usate da react-router.
 */
const { TestEnvironment } = require('jest-environment-jsdom');

module.exports = class BusterCinemaEnvironment extends TestEnvironment {
  constructor(...args) {
    super(...args);
    for (const name of ['fetch', 'Request', 'Response', 'Headers', 'FormData', 'AbortController', 'AbortSignal', 'TextEncoder', 'TextDecoder', 'ReadableStream', 'structuredClone']) {
      if (typeof this.global[name] === 'undefined' && typeof globalThis[name] !== 'undefined') this.global[name] = globalThis[name];
    }
  }
};
