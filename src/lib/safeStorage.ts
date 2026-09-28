/**
 * Safe Storage wrapper with memory fallback for private/incognito browsing,
 * iframe sandboxing, or restricted security environments where accessing
 * window.localStorage or window.sessionStorage throws a SecurityError.
 */

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();

let cachedLocalStorage: Storage | null = null;
let cachedSessionStorage: Storage | null = null;

export function getSafeLocalStorage(): Storage {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }
  if (cachedLocalStorage) {
    return cachedLocalStorage;
  }

  try {
    const storage = window.localStorage;
    const testKey = '__storage_test_probe__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    cachedLocalStorage = storage;
    return storage;
  } catch {
    cachedLocalStorage = memoryStorage;
    return memoryStorage;
  }
}

export function getSafeSessionStorage(): Storage {
  if (typeof window === 'undefined') {
    return memoryStorage;
  }
  if (cachedSessionStorage) {
    return cachedSessionStorage;
  }

  try {
    const storage = window.sessionStorage;
    const testKey = '__storage_test_probe__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    cachedSessionStorage = storage;
    return storage;
  } catch {
    cachedSessionStorage = memoryStorage;
    return memoryStorage;
  }
}

export const safeLocalStorage: Storage = {
  get length(): number {
    try {
      return getSafeLocalStorage().length;
    } catch {
      return memoryStorage.length;
    }
  },
  clear(): void {
    try {
      getSafeLocalStorage().clear();
    } catch {
      memoryStorage.clear();
    }
  },
  getItem(key: string): string | null {
    try {
      return getSafeLocalStorage().getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  },
  key(index: number): string | null {
    try {
      return getSafeLocalStorage().key(index);
    } catch {
      return memoryStorage.key(index);
    }
  },
  removeItem(key: string): void {
    try {
      getSafeLocalStorage().removeItem(key);
    } catch {
      memoryStorage.removeItem(key);
    }
  },
  setItem(key: string, value: string): void {
    try {
      getSafeLocalStorage().setItem(key, value);
    } catch {
      memoryStorage.setItem(key, value);
    }
  },
};
