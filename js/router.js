import { getText } from './services/textService.js';

/**
 * Route configuration — maps URL paths to page modules
 * All pages use dynamic import for code splitting
 */
const routes = {
  home: () => import('./pages/home.js'),
  community: () => import('./pages/community.js'),
  alumniphotos: () => import('./pages/alumniphotos.js'),
  alumniprofs: () => import('./pages/alumniprofs.js'),
  alumnievents: () => import('./pages/alumnievents.js'),
  reunion: () => import('./pages/reunion.js'),
  reuniongreetings: () => import('./pages/reuniongreetings.js'),
  reunionvideos: () => import('./pages/reunionvideos.js'),
  reunionphotos: () => import('./pages/reunionphotos.js'),
  reunionattendees: () => import('./pages/reunionattendees.js'),
  eventregistration: () => import('./pages/eventregistration.js'),
  directory: () => import('./pages/directory.js'),
  faq: () => import('./pages/faq.js'),
  thinktank: () => import('./pages/thinktank.js'),
  contact: () => import('./pages/contact.js')
};

// Default fallback route
const FALLBACK_ROUTE = 'home';

// Track current route for deduplication
let currentRoute = null;
let currentAbortController = null;

/**
 * Fade the app container out before swapping content.
 * Kept dependency-free (inline styles) so it works regardless of
 * which visual theme is active.
 */
function fadeOutApp(app) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    app.style.transition = 'opacity 0.15s ease';
    app.style.opacity = '0';
    setTimeout(resolve, 150);
  });
}

/**
 * Fade the app container back in after new content is rendered.
 */
function fadeInApp(app) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    app.style.opacity = '1';
    app.style.transform = 'none';
    return;
  }
  app.style.opacity = '0';
  app.style.transform = 'translateY(6px)';
  // Force reflow so the transition below actually animates
  // eslint-disable-next-line no-unused-expressions
  app.offsetHeight;
  app.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  app.style.opacity = '1';
  app.style.transform = 'translateY(0)';
}

/**
 * Get the current route path from URL hash
 */
function getCurrentRoute() {
  const rawPath = location.hash.replace('#/', '') || FALLBACK_ROUTE;
  return rawPath.split('?')[0] || FALLBACK_ROUTE;
}

/**
 * Show loading state in the app container
 */
function showLoading() {
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  const loadingAriaLabel = getText(
    'router.loadingAriaLabel',
    'Φόρτωση σελίδας'
  );

  const loadingText = getText(
    'router.loading',
    'Φόρτωση...'
  );

  app.innerHTML = `
    <div class="loading" role="status" aria-label="${loadingAriaLabel}">
      <div class="loading-spinner"></div>
      <p>${loadingText}</p>
    </div>
  `;
}

/**
 * Show error state in the app container
 */
function showError(message, details = null) {
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  const errorTitle = getText(
    'router.errorTitle',
    '⚠️ Σφάλμα'
  );

  const defaultMessage = getText(
    'router.pageLoadError',
    'Αποτυχία φόρτωσης της σελίδας.'
  );

  const reloadText = getText(
    'router.reload',
    'Επαναφόρτωση'
  );

  app.innerHTML = `
    <section class="route-error" role="alert">
      <h2>${errorTitle}</h2>
      <p>${message || defaultMessage}</p>
      ${details ? `<pre style="white-space:pre-wrap;color:#ff8080;font-size:0.85rem;max-height:200px;overflow:auto;">${details}</pre>` : ''}
      <button onclick="location.reload()" style="margin-top:16px;padding:8px 20px;cursor:pointer;">
        ${reloadText}
      </button>
    </section>
  `;
}

/**
 * Show 404 error
 */
function show404() {
  const app = document.getElementById('app');

  if (!app) {
    return;
  }

  const notFoundTitle = getText(
    'router.notFoundTitle',
    '404'
  );

  const notFoundMessage = getText(
    'router.notFoundMessage',
    'Η σελίδα δεν βρέθηκε.'
  );

  const homePageText = getText(
    'router.homePage',
    'Αρχική Σελίδα'
  );

  app.innerHTML = `
    <section class="route-error">
      <h2>${notFoundTitle}</h2>
      <p>${notFoundMessage}</p>
      <a href="#/home" style="display:inline-block;margin-top:16px;padding:8px 20px;background:#1F3A5F;color:#fff;border-radius:4px;text-decoration:none;">
        ${homePageText}
      </a>
    </section>
  `;
}

/**
 * Main route loader with:
 * - Loading state
 * - Abort controller (cancel in-flight requests)
 * - Error boundaries
 * - Scroll restoration
 */
export async function loadRoute() {
  const app = document.getElementById('app');
  const path = getCurrentRoute();

  if (!app) {
    console.error('Router: #app container was not found.');
    return;
  }

  // Prevent double-loading the same route
  if (path === currentRoute && !location.hash.includes('?')) {
    return;
  }

  // Cancel any in-progress request
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  // Update current route
  currentRoute = path;

  // Fade out the current view before swapping (skip on first load,
  // when the app container only holds the initial loading markup)
  if (app.dataset.routed === 'true') {
    await fadeOutApp(app);
  }
  app.dataset.routed = 'true';

  // Show loading state
  showLoading();

  // Get the module loader
  const moduleLoader = routes[path];

  if (!moduleLoader) {
    show404();
    currentRoute = null;
    return;
  }

  // Create abort controller for this request
  const controller = new AbortController();
  currentAbortController = controller;

  try {
    // Dynamic import with abort signal
    const module = await moduleLoader();

    // Check if this request was aborted
    if (controller.signal.aborted) {
      return;
    }

    // Clear the abort controller if successful
    if (currentAbortController === controller) {
      currentAbortController = null;
    }

    // Render the page
    app.innerHTML = await module.render();

    // Run afterRender hook if it exists
    if (typeof module.afterRender === 'function') {
      try {
        await module.afterRender();
      } catch (afterError) {
        console.warn('afterRender hook failed:', afterError);
        // Don't show error to user — page already rendered
      }
    }

    // Scroll to top on route change
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Fade the new content in
    fadeInApp(app);

  } catch (err) {
    // Check if this error was from an aborted request
    if (
      err?.name === 'AbortError' ||
      (err?.name === 'DOMException' && err?.code === 20)
    ) {
      console.log('Route load aborted:', path);
      return;
    }

    console.error('ROUTER ERROR:', err);

    showError(
      getText(
        'router.pageLoadError',
        'Αποτυχία φόρτωσης της σελίδας.'
      ),
      err.stack || err.message || String(err)
    );

    currentRoute = null;
  }
}

/**
 * Preload a route (for hover/click prefetching)
 * Useful for improving perceived performance
 */
export function preloadRoute(path) {
  const moduleLoader = routes[path];

  if (moduleLoader) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => moduleLoader());
    } else {
      setTimeout(() => moduleLoader(), 100);
    }
  }
}

/**
 * Get all available routes
 */
export function getRoutes() {
  return Object.keys(routes);
}

/**
 * Check if a route exists
 */
export function routeExists(path) {
  return path in routes;
}
