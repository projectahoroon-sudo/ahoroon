export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[safeStorage] setItem failed for key "${key}":`, error);
    // If quota exceeded, attempt to clear old cache keys to free up space
    try {
      const cacheKeys = [
        'orders',
        'products',
        'categories',
        'users',
        'manualInvoices',
        'sliders',
        'producers',
        'press',
        'flashSaleProducts',
        'viewed_products'
      ];
      for (const k of cacheKeys) {
        if (k !== key) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(key, value);
    } catch (retryError) {
      // Silently ignore if quota is strictly reached. The app will continue working with Firestore directly.
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
