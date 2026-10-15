const STORAGE_PREFIX = "nodepath:";

export const STORAGE_KEYS = {
  progress: `${STORAGE_PREFIX}progress-v1`,
} as const;

export function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage full or unavailable — progress keeps working in memory */
  }
}

export function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readJson<T>(key: string): T | null {
  const raw = safeGetItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  safeSetItem(key, JSON.stringify(value));
}
