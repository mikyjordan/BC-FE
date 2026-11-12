import { afterEach, describe, expect, it } from '@jest/globals';
import { newIdempotencyKey, randomId } from '../src/api/client';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('identificativi casuali', () => {
  const realCrypto = globalThis.crypto;
  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
  });

  it('funzionano anche senza crypto.randomUUID (sito aperto in http da un altro dispositivo)', () => {
    const real = realCrypto;
    // come nel browser su una pagina http non sicura: c'è getRandomValues, non randomUUID
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: <T extends ArrayBufferView<ArrayBuffer>>(a: T) => real.getRandomValues(a) },
      configurable: true,
    });
    const ids = new Set(Array.from({ length: 200 }, () => randomId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(newIdempotencyKey()).toMatch(/^web-[0-9a-f-]{36}$/);
  });
});
