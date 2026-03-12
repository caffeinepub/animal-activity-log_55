/**
 * Centralized cache persistence utilities for React Query
 */

export const CACHE_KEY = 'BALL_PYTHON_TRACKER_CACHE_V1';
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Clear all persisted cache data from localStorage
 */
export function clearPersistedCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[Cache] Cleared persisted cache');
  } catch (error) {
    console.warn('[Cache] Failed to clear persisted cache:', error);
  }
}

/**
 * Clear all app-related localStorage keys including PWA install prompt state
 */
export function clearAllAppStorage(): void {
  try {
    const keysToRemove: string[] = [];
    
    // Find all keys that belong to this app
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('BALL_PYTHON_') ||
        key.includes('animal-activity') ||
        key.includes('pwa-install') ||
        key === CACHE_KEY
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('[Cache] Cleared all app storage:', keysToRemove.length, 'keys');
  } catch (error) {
    console.warn('[Cache] Failed to clear app storage:', error);
  }
}
