type Parse = (code: string, opts: object) => unknown;
export function files(srcDir: string): string[];
export function findHardcoded(code: string, parse: Parse): { line: number; text: string }[];
export function findTranslationCalls(code: string, parse: Parse): { line: number; key: string | null; params?: string[] | null }[];
export function isText(s: string): boolean;
export function isUiText(s: string): boolean;
