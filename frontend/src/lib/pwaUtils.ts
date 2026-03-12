/**
 * Utility functions for PWA functionality
 */

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the app can be installed (PWA install prompt available)
 */
export function canInstall(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/**
 * Request persistent storage for better offline experience
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[PWA] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (error) {
      console.error('[PWA] Error requesting persistent storage:', error);
      return false;
    }
  }
  return false;
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error('[PWA] Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Unregister all service workers (useful for debugging)
 */
export async function unregisterServiceWorkers(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('[PWA] All service workers unregistered');
  } catch (error) {
    console.error('[PWA] Error unregistering service workers:', error);
  }
}

/**
 * Check if the app is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add online/offline event listeners
 */
export function addConnectivityListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Wait for service worker to be ready
 */
export async function waitForServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[PWA] Service worker is ready');
    return registration;
  } catch (error) {
    console.error('[PWA] Error waiting for service worker:', error);
    return null;
  }
}

/**
 * Check if running in PWA mode and log status
 */
export function logPWAStatus(): void {
  console.log('[PWA] Status:', {
    standalone: isStandalone(),
    serviceWorkerSupported: isServiceWorkerSupported(),
    online: isOnline(),
    userAgent: navigator.userAgent,
  });
}

/**
 * Detect if a service worker update is available
 */
export async function checkForServiceWorkerUpdate(): Promise<ServiceWorker | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return null;
    }

    // Check if there's a waiting service worker
    if (registration.waiting) {
      console.log('[PWA] Service worker update available (waiting)');
      return registration.waiting;
    }

    // Check if there's an installing service worker
    if (registration.installing) {
      console.log('[PWA] Service worker update available (installing)');
      return registration.installing;
    }

    return null;
  } catch (error) {
    console.error('[PWA] Error checking for service worker update:', error);
    return null;
  }
}

/**
 * Trigger service worker update and reload
 */
export async function triggerServiceWorkerUpdate(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    console.warn('[PWA] Service workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('[PWA] No service worker registration found');
      return;
    }

    const waitingWorker = registration.waiting;
    if (!waitingWorker) {
      console.log('[PWA] No waiting service worker, checking for updates...');
      await registration.update();
      return;
    }

    console.log('[PWA] Triggering service worker update...');

    // Send SKIP_WAITING message
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });

    // Wait for the new service worker to activate
    return new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service worker updated, reloading...');
        resolve();
        window.location.reload();
      }, { once: true });
    });
  } catch (error) {
    console.error('[PWA] Error triggering service worker update:', error);
    throw error;
  }
}

/**
 * Reset offline/PWA state by clearing cache and unregistering service workers
 */
export async function resetOfflineState(): Promise<void> {
  console.log('[PWA] Resetting offline state...');
  
  try {
    // Unregister all service workers
    await unregisterServiceWorkers();
    
    console.log('[PWA] Offline state reset complete');
  } catch (error) {
    console.error('[PWA] Error resetting offline state:', error);
    throw error;
  }
}
