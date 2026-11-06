import { afterEach, describe, expect, it, vi } from 'vitest';
import { newIdempotencyKey, randomId } from '../src/api/client';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('identificativi casuali', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('funzionano anche senza crypto.randomUUID (sito aperto in http da un altro dispositivo)', () => {
    const real = globalThis.crypto;
    // come nel browser su una pagina http non sicura: c'è getRandomValues, non randomUUID
    vi.stubGlobal('crypto', { getRandomValues: <T extends ArrayBufferView<ArrayBuffer>>(a: T) => real.getRandomValues(a) });
    const ids = new Set(Array.from({ length: 200 }, () => randomId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(newIdempotencyKey()).toMatch(/^web-[0-9a-f-]{36}$/);
  });
});
