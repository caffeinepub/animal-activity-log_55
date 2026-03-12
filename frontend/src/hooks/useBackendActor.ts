import { useState, useEffect } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { createActorWithConfig } from '../config';
import type { backendInterface } from '../backend';

/**
 * Hook for creating an authenticated backend actor without implicit access control initialization.
 * This hook provides a stable actor instance for React Query hooks to depend on.
 * Access control initialization must be handled explicitly by the app bootstrap logic.
 */
export function useBackendActor() {
  const { identity, isInitializing: identityInitializing } = useInternetIdentity();
  const [actor, setActor] = useState<backendInterface | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const createActorInstance = async () => {
      if (!identity || identityInitializing) {
        setActor(null);
        setError(null);
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        console.log('[useBackendActor] Creating actor with authenticated identity');
        
        const actorOptions = {
          agentOptions: {
            identity
          }
        };

        const newActor = await createActorWithConfig(actorOptions);
        
        if (mounted) {
          setActor(newActor);
          console.log('[useBackendActor] Actor created successfully');
        }
      } catch (err) {
        console.error('[useBackendActor] Failed to create actor:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to create actor'));
          setActor(null);
        }
      } finally {
        if (mounted) {
          setIsCreating(false);
        }
      }
    };

    createActorInstance();

    return () => {
      mounted = false;
    };
  }, [identity, identityInitializing]);

  return {
    actor,
    isFetching: identityInitializing || isCreating,
    isReady: !!actor && !isCreating && !identityInitializing,
    error,
  };
}
