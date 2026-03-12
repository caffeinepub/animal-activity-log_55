import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { AnimalList } from './components/AnimalList';
import { OverviewPage } from './components/OverviewPage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginScreen } from './components/LoginScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BootstrapTimeoutScreen } from './components/BootstrapTimeoutScreen';
import { RoleLoadingRecoveryScreen } from './components/RoleLoadingRecoveryScreen';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useInitializeAccessControl, useGetCallerUserRole } from './hooks/useQueries';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { clearPersistedCache, clearAllAppStorage, CACHE_KEY, CACHE_MAX_AGE } from './lib/cachePersistence';
import { resetOfflineState } from './lib/pwaUtils';
import { Button } from './components/ui/button';
import { Download } from 'lucide-react';

// Advanced infrastructure tier: Enhanced query client with aggressive caching and persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - data stays fresh longer
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache much longer
      retry: 3, // More retry attempts
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true, // Refetch when connection restored
      networkMode: 'online',
    },
    mutations: {
      networkMode: 'online',
      retry: 2, // Retry mutations on failure
      retryDelay: 1000,
    },
  },
});

// Advanced infrastructure tier: Custom cache persistence using localStorage
function saveCacheToStorage() {
  try {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const cacheData = queries.map(query => ({
      queryKey: query.queryKey,
      state: query.state,
      timestamp: Date.now(),
    }));
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('[Cache] Saved to localStorage:', cacheData.length, 'queries');
  } catch (error) {
    console.warn('[Cache] Failed to save to localStorage:', error);
  }
}

function loadCacheFromStorage() {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return;

    const cacheData = JSON.parse(stored);
    const now = Date.now();

    cacheData.forEach((item: any) => {
      // Skip expired cache entries
      if (now - item.timestamp > CACHE_MAX_AGE) {
        return;
      }

      // Restore query data
      queryClient.setQueryData(item.queryKey, item.state.data);
    });

    console.log('[Cache] Loaded from localStorage:', cacheData.length, 'queries');
  } catch (error) {
    console.warn('[Cache] Failed to load from localStorage:', error);
  }
}

// Load cache on startup
loadCacheFromStorage();

// Save cache periodically and on page unload
let saveTimeout: NodeJS.Timeout;
function scheduleCacheSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveCacheToStorage, 5000); // Debounce saves
}

// Listen for query updates
queryClient.getQueryCache().subscribe(() => {
  scheduleCacheSave();
});

// Save on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', saveCacheToStorage);
}

function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background safe-area-inset">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function ErrorScreen({ 
  title, 
  message, 
  onRetry 
}: { 
  title: string; 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 safe-area-inset">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-destructive mb-4">{title}</h1>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background safe-area-layout">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-8 pb-safe">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <Toaster />
      <PWAInstallPrompt />
      <OfflineIndicator />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AuthenticatedLayout,
  errorComponent: ({ error }) => (
    <ErrorScreen
      title="Something went wrong"
      message={error?.message || 'An unexpected error occurred'}
      onRetry={() => window.location.reload()}
    />
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AnimalList,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: OverviewPage,
});

const routeTree = rootRoute.addChildren([indexRoute, overviewRoute]);
const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

function AuthenticatedApp() {
  const { identity } = useInternetIdentity();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched, error: roleError, refetch: refetchRole } = useGetCallerUserRole();
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched, error: profileError, refetch: refetchProfile } = useGetCallerUserProfile();
  const initializeAccessControl = useInitializeAccessControl();
  const [showSetup, setShowSetup] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Track initialization per principal to ensure idempotency
  const initializationAttemptedRef = useRef<Set<string>>(new Set());
  const currentPrincipal = identity?.getPrincipal().toString();

  // Watchdog timer to detect stuck loading states
  useEffect(() => {
    const BOOTSTRAP_TIMEOUT = 20000; // 20 seconds
    const timer = setTimeout(() => {
      if (roleLoading || profileLoading || initializeAccessControl.isPending) {
        console.error('[App] Bootstrap timeout - stuck in loading state');
        setShowTimeout(true);
      }
    }, BOOTSTRAP_TIMEOUT);

    return () => clearTimeout(timer);
  }, [roleLoading, profileLoading, initializeAccessControl.isPending]);

  // Idempotent access control initialization - runs exactly once per principal when role is guest
  useEffect(() => {
    const autoInitialize = async () => {
      if (!currentPrincipal || !roleFetched || userRole !== 'guest') {
        return;
      }

      // Check if we've already attempted initialization for this principal
      if (initializationAttemptedRef.current.has(currentPrincipal)) {
        console.log('[App] Initialization already attempted for principal:', currentPrincipal);
        return;
      }

      // Prevent concurrent initialization attempts
      if (initializeAccessControl.isPending) {
        return;
      }

      console.log('[App] Auto-initializing access control for new user (principal:', currentPrincipal, ')');
      initializationAttemptedRef.current.add(currentPrincipal);
      
      try {
        await initializeAccessControl.mutateAsync();
        console.log('[App] Access control initialized successfully');
        toast.success('Account initialized successfully!');
        
        // After successful initialization, refetch role and profile to get updated state
        console.log('[App] Refetching role and profile after initialization...');
        await Promise.all([
          refetchRole(),
          refetchProfile(),
        ]);
        console.log('[App] Role and profile refetched successfully');
      } catch (error) {
        console.error('[App] Failed to initialize access control:', error);
        // Remove from attempted set so retry can work
        initializationAttemptedRef.current.delete(currentPrincipal);
        toast.error('Failed to initialize account');
      }
    };

    autoInitialize();
  }, [roleFetched, userRole, currentPrincipal, initializeAccessControl, refetchRole, refetchProfile]);

  // Show profile setup if user has no profile
  useEffect(() => {
    if (profileFetched && userProfile === null && !profileLoading && userRole !== 'guest') {
      setShowSetup(true);
    } else if (profileFetched && userProfile !== null) {
      setShowSetup(false);
    }
  }, [profileFetched, userProfile, profileLoading, userRole]);

  // Targeted recovery handler - clears queries and re-runs bootstrap without full reload
  const handleTargetedRecovery = async () => {
    console.log('[App] Starting targeted recovery...');
    setIsRecovering(true);
    setShowTimeout(false);
    
    // Clear the initialization attempt tracking for current principal
    if (currentPrincipal) {
      initializationAttemptedRef.current.delete(currentPrincipal);
    }
    
    // Remove queries to force fresh fetch
    queryClient.removeQueries({ queryKey: ['currentUserRole'] });
    queryClient.removeQueries({ queryKey: ['currentUserProfile'] });
    
    // Refetch to trigger bootstrap flow again
    try {
      await Promise.all([
        refetchRole(),
        refetchProfile(),
      ]);
      console.log('[App] Targeted recovery completed');
      toast.success('Recovery successful');
    } catch (error) {
      console.error('[App] Targeted recovery failed:', error);
      toast.error('Recovery failed. Please try resetting offline data.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Handle reset offline state
  const handleResetOfflineState = async () => {
    try {
      console.log('[App] Resetting offline state...');
      toast.loading('Resetting offline data...');
      
      // Clear persisted cache
      clearAllAppStorage();
      
      // Reset PWA state
      await resetOfflineState();
      
      // Reload the app
      window.location.reload();
    } catch (error) {
      console.error('[App] Failed to reset offline state:', error);
      toast.error('Failed to reset offline data');
    }
  };

  // Show timeout screen if bootstrap is stuck
  if (showTimeout) {
    return (
      <BootstrapTimeoutScreen
        title="Loading Timeout"
        message="The app is taking longer than expected to load. This might be due to a slow connection or cached data."
        onRetry={handleTargetedRecovery}
        onReset={handleResetOfflineState}
      />
    );
  }

  // Show role loading recovery screen if role is guest after initialization attempt
  if (roleFetched && userRole === 'guest' && currentPrincipal && initializationAttemptedRef.current.has(currentPrincipal) && !initializeAccessControl.isPending) {
    return (
      <RoleLoadingRecoveryScreen
        title="Error Loading User Role"
        message="User is not registered"
        onRecover={handleTargetedRecovery}
        onReset={handleResetOfflineState}
        isRecovering={isRecovering}
      />
    );
  }

  // Show error if role fetch failed
  if (roleError) {
    return (
      <RoleLoadingRecoveryScreen
        title="Error Loading User Role"
        message={roleError instanceof Error ? roleError.message : 'Failed to load your user role. Please try again.'}
        onRecover={handleTargetedRecovery}
        onReset={handleResetOfflineState}
        isRecovering={isRecovering}
      />
    );
  }

  // Show error if profile fetch failed
  if (profileError) {
    return (
      <ErrorScreen
        title="Error Loading Profile"
        message={profileError instanceof Error ? profileError.message : 'Failed to load your profile. Please try again.'}
        onRetry={handleTargetedRecovery}
      />
    );
  }

  // Show loading during initialization or profile loading
  if (roleLoading || initializeAccessControl.isPending) {
    return <LoadingScreen message={initializeAccessControl.isPending ? "Setting up your account..." : "Loading..."} />;
  }

  if (profileLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (showSetup) {
    return (
      <div className="min-h-screen flex flex-col bg-background safe-area-inset">
        <ProfileSetup />
        <Toaster />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

function ServiceWorkerUpdateBanner() {
  const { updateAvailable, isUpdating, applyUpdate } = useServiceWorkerUpdate();

  if (!updateAvailable || isUpdating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <p className="text-sm font-medium">A new version is available!</p>
        <Button
          onClick={applyUpdate}
          size="sm"
          variant="secondary"
          className="flex-shrink-0"
        >
          <Download className="mr-2 h-4 w-4" />
          Update Now
        </Button>
      </div>
    </div>
  );
}

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Advanced infrastructure tier: Performance monitoring
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Performance] User authenticated, app ready');
      // Mark app as ready for performance tracking
      if (window.performance && window.performance.mark) {
        window.performance.mark('app-ready');
      }
    }
  }, [isAuthenticated]);

  // Show loading only during identity initialization
  if (isInitializing) {
    return <LoadingScreen message="Initializing..." />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show authenticated app
  return (
    <>
      <ServiceWorkerUpdateBanner />
      <AuthenticatedApp />
    </>
  );
}

export default function App() {
  // Advanced infrastructure tier: Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[Global Error Handler]', event.error);
      // Log to monitoring service if available
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[Unhandled Promise Rejection]', event.reason);
      // Log to monitoring service if available
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RootComponent />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
