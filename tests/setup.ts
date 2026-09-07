// Vitest setup file
import '@testing-library/jest-dom';

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const memStore: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => memStore[k] || null,
    setItem: (k: string, v: string) => { memStore[k] = String(v); },
    removeItem: (k: string) => { delete memStore[k]; },
    clear: () => { Object.keys(memStore).forEach(k => delete memStore[k]); },
    length: 0,
    key: () => null
  };
}
