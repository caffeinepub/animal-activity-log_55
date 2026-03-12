import { useState, useEffect } from 'react';
import { checkForServiceWorkerUpdate, triggerServiceWorkerUpdate } from '../lib/pwaUtils';

/**
 * Hook to detect and handle service worker updates
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkUpdate = async () => {
      const waitingWorker = await checkForServiceWorkerUpdate();
      if (mounted && waitingWorker) {
        setUpdateAvailable(true);
      }
    };

    // Check immediately
    checkUpdate();

    // Check periodically
    const interval = setInterval(checkUpdate, 60000); // Every minute

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (mounted) {
          console.log('[SW Update] Controller changed, update complete');
        }
      });
    }

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const applyUpdate = async () => {
    setIsUpdating(true);
    try {
      await triggerServiceWorkerUpdate();
    } catch (error) {
      console.error('[SW Update] Failed to apply update:', error);
      setIsUpdating(false);
    }
  };

  return {
    updateAvailable,
    isUpdating,
    applyUpdate,
  };
}
