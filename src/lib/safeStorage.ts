export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[safeStorage] setItem failed for key "${key}":`, error);
    // If quota exceeded, only clear non-essential transient keys
    try {
      localStorage.removeItem('viewed_products');
      localStorage.removeItem('firestoreDisabled');
      localStorage.setItem(key, value);
    } catch (retryError) {
      // Silently ignore if browser local storage quota is full
    }
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[safeStorage] getItem failed for key "${key}":`, error);
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Ignore
  }
}
