// Advanced infrastructure tier: Enhanced service worker with improved caching and stability
const CACHE_NAME = 'animal-activity-log-v6';
const RUNTIME_CACHE = 'runtime-cache-v6';
const OFFLINE_CACHE = 'offline-cache-v6';

// Assets to cache on install - only static assets, not source files
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/assets/generated/snake-logo.dim_192x192.png',
  '/assets/generated/snake-logo.dim_512x512.png',
  '/assets/generated/snake-logo-maskable.dim_512x512.png'
];

// Advanced infrastructure tier: Install event with enhanced error handling
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v6 with advanced infrastructure...');
  event.waitUntil(
    Promise.all([
      // Cache essential assets
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[Service Worker] Caching app shell');
          return Promise.allSettled(
            PRECACHE_ASSETS.map(url => 
              fetch(url, { cache: 'reload' })
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                  console.warn(`[Service Worker] Failed to cache ${url}: ${response.status}`);
                  return null;
                })
                .catch(err => {
                  console.warn(`[Service Worker] Failed to fetch ${url}:`, err);
                  return null;
                })
            )
          );
        }),
      // Create offline cache
      caches.open(OFFLINE_CACHE)
        .then((cache) => {
          console.log('[Service Worker] Creating offline cache');
          return cache.put('/offline.html', createOfflineResponse());
        })
    ])
    .then(() => {
      console.log('[Service Worker] Install complete, skipping waiting');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('[Service Worker] Install failed:', error);
    })
  );
});

// Advanced infrastructure tier: Activate event with thorough cleanup
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating v6...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => 
                name !== CACHE_NAME && 
                name !== RUNTIME_CACHE && 
                name !== OFFLINE_CACHE
              )
              .map((name) => {
                console.log('[Service Worker] Deleting old cache:', name);
                return caches.delete(name);
              })
          );
        }),
      // Claim all clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('[Service Worker] Activation complete');
    })
    .catch((error) => {
      console.error('[Service Worker] Activation error:', error);
    })
  );
});

// Advanced infrastructure tier: Helper function to check if URL should bypass cache
function shouldBypassCache(url) {
  try {
    const urlObj = new URL(url);
    
    // Skip cross-origin requests
    if (urlObj.origin !== location.origin) {
      return true;
    }

    // Skip Internet Identity and canister calls - always go to network
    if (
      urlObj.pathname.includes('/.well-known/') ||
      urlObj.pathname.includes('/api/') ||
      urlObj.search.includes('canisterId=') ||
      urlObj.hostname.includes('ic0.app') ||
      urlObj.hostname.includes('icp0.io') ||
      urlObj.hostname.includes('internetcomputer.org') ||
      urlObj.hostname.includes('identity.ic0.app') ||
      (urlObj.hostname.includes('localhost') && urlObj.port !== location.port)
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Service Worker] Error parsing URL:', url, error);
    return true; // Skip on error
  }
}

// Advanced infrastructure tier: Enhanced fetch event with better caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip requests that should bypass cache
  if (shouldBypassCache(request.url)) {
    return;
  }

  // For navigation requests, prefer network when online to avoid stale shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((response) => {
          // Cache successful responses
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseClone))
              .catch((err) => console.warn('[Service Worker] Cache put error:', err));
          }
          return response;
        })
        .catch((error) => {
          console.log('[Service Worker] Network failed for navigation, trying cache:', error);
          // Fallback to cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback to index.html for SPA routing
              return caches.match('/index.html')
                .then((indexResponse) => {
                  if (indexResponse) {
                    return indexResponse;
                  }
                  // Return offline page
                  return caches.match('/offline.html')
                    .then((offlineResponse) => {
                      if (offlineResponse) {
                        return offlineResponse;
                      }
                      return createOfflineResponse();
                    });
                });
            });
        })
    );
    return;
  }

  // Advanced infrastructure tier: For other requests - cache first with stale-while-revalidate
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version immediately
        const fetchPromise = fetch(request)
          .then((response) => {
            // Update cache in background if successful
            if (response && response.ok) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone))
                .catch(() => {});
            }
            return response;
          })
          .catch(() => null);

        // Return cached response or wait for network
        return cachedResponse || fetchPromise.then((response) => {
          if (response) {
            return response;
          }
          // Return offline fallback
          return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Advanced infrastructure tier: Helper to create offline response
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - Ball Python Tracker</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 { margin-bottom: 1rem; font-size: 2rem; }
        p { margin-bottom: 1.5rem; opacity: 0.9; }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🐍</div>
        <h1>You're Offline</h1>
        <p>Ball Python Tracker requires an internet connection. Please check your connection and try again.</p>
        <button onclick="window.location.reload()">Retry Connection</button>
      </div>
    </body>
    </html>`,
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html',
      }),
    }
  );
}

// Advanced infrastructure tier: Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    console.log('[Service Worker] Received CLIENTS_CLAIM message');
    self.clients.claim();
  }

  // Advanced infrastructure tier: Cache status check
  if (event.data && event.data.type === 'CACHE_STATUS') {
    caches.keys().then((cacheNames) => {
      event.ports[0].postMessage({
        caches: cacheNames,
        version: 'v6',
        status: 'active'
      });
    });
  }
});

// Advanced infrastructure tier: Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Implement data sync logic here
      Promise.resolve()
    );
  }
});

// Log service worker lifecycle events
console.log('[Service Worker] Script loaded - Advanced Infrastructure Tier v6');
