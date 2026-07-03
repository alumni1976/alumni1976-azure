import { loadRoute } from './router.js';

/**
 * Configuration
 */
const CONFIG = {
  // Maximum retry attempts for menu loading
  maxMenuRetries: 2,
  // Delay between menu retry attempts (ms)
  menuRetryDelay: 1000,
  // Timeout for menu loading (ms)
  menuTimeout: 10000
};

/**
 * Fallback menu structure - used when database is unavailable
 */
const FALLBACK_MENU = [
  { item: 'Αρχική', url: 'home' },
  { item: 'Μέλη', url: 'community' },
  { item: 'Φωτογραφίες', url: 'alumniphotos' },
  { item: 'Καθηγητές', url: 'alumniprofs' },
  { item: 'Εκδηλώσεις', url: 'alumnievents' },
  { item: 'ThinkTank', url: 'thinktank' },
  {
    item: 'Reunion 1976',
    url: 'reunion',
    children: [
      { item: 'Εντυπώσεις Πρωταγωνιστών', url: 'reuniongreetings' },
      { item: 'Βίντεο Ομιλητών', url: 'reunionvideos' },
      { item: 'Φωτογραφικό Υλικό', url: 'reunionphotos' },
      { item: 'Συμμετέχοντες', url: 'reunionattendees' }
    ]
  }
];

/**
 * Normalize route string to consistent format
 */
function normalizeRoute(url) {
  if (!url) return 'home';
  let r = String(url)
    .trim()
    .replace(/\.html$/, '')
    .replace(/^#\//, '')
    .replace(/^\//, '');
  return (r === 'index' || r === '') ? 'home' : r;
}

/**
 * Close all open dropdown menus
 */
function closeAllDropdowns() {
  document.querySelectorAll('#menu .has-dropdown')
    .forEach(li => li.classList.remove('open'));
}

/**
 * Set active menu item based on current hash
 */
function setActiveMenuItem() {
  const path = location.hash.replace('#/', '') || 'home';

  // Clear all active states first
  document.querySelectorAll('#menu a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href') || '';
    if (href === '#/' + path) {
      a.classList.add('active');
    }
  });

  // Parent dropdown items get active class if child is active
  document.querySelectorAll('#menu .has-dropdown').forEach(li => {
    const hasActiveChild = li.querySelector('a.active');
    const topLink = li.querySelector(':scope > a');
    if (hasActiveChild && topLink) {
      topLink.classList.add('active');
    }
  });
}

/**
 * Render menu from data rows
 */
function renderMenuRows(rows) {
  const menu = document.getElementById('menu');
  if (!menu) return;

  // Build menu HTML
  menu.innerHTML = rows.map(row => {
    const route = normalizeRoute(row.url);

    if (row.children && row.children.length) {
      const childItems = row.children.map(child =>
        `<li><a href="#/${normalizeRoute(child.url)}">${child.item}</a></li>`
      ).join('');

      return `
        <li class="has-dropdown" role="none">
          <a href="#/${route}" class="dropdown-toggle" role="menuitem" aria-haspopup="true">
            ${row.item}
            <span class="dropdown-caret" aria-hidden="true">▾</span>
          </a>
          <ul class="dropdown-menu" role="menu">${childItems}</ul>
        </li>
      `;
    }

    return `<li role="none"><a href="#/${route}" role="menuitem">${row.item}</a></li>`;
  }).join('');

  // Attach dropdown toggle events
  menu.querySelectorAll('.has-dropdown').forEach(li => {
    const toggle = li.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        const isOpen = li.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) {
          e.preventDefault();
          li.classList.add('open');
        }
      });
    }
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#menu')) {
      closeAllDropdowns();
    }
  });

  setActiveMenuItem();
}

/**
 * Load menu data from Supabase with fallback
 */
async function renderMenu() {
  const dbScript = document.getElementById('supabase-db');
  const apiKey = dbScript?.dataset?.apikey;

  // If no API key, use fallback immediately
  if (!apiKey) {
    console.warn('No API key found, using fallback menu');
    renderMenuRows(FALLBACK_MENU);
    return;
  }

  // Try to load menu from database with retries
  let attempts = 0;
  let loaded = false;

  while (attempts <= CONFIG.maxMenuRetries && !loaded) {
    try {
      // Check if menuRepository is available
      if (!window.menuRepository) {
        // Wait a bit for database.js to load
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
        continue;
      }

      const dataset = await window.menuRepository.fetchMenuData('menuitems');

      if (dataset?.items?.length) {
        const items = dataset.items;

        // Ensure Reunion has children from fallback
        const reunionIdx = items.findIndex(
          i => normalizeRoute(i.url) === 'reunion'
        );

        if (reunionIdx >= 0) {
          const fallbackReunion = FALLBACK_MENU.find(
            m => normalizeRoute(m.url) === 'reunion'
          );
          if (fallbackReunion?.children) {
            items[reunionIdx].children = fallbackReunion.children;
          }
        }

        renderMenuRows(items);
        loaded = true;
        break;
      }

      attempts++;
      if (attempts <= CONFIG.maxMenuRetries) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.menuRetryDelay));
      }

    } catch (error) {
      console.warn(`Menu load attempt ${attempts + 1} failed:`, error.message);
      attempts++;
      if (attempts <= CONFIG.maxMenuRetries) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.menuRetryDelay));
      }
    }
  }

  // If all attempts failed, use fallback
  if (!loaded) {
    console.warn('All menu load attempts failed, using fallback');
    renderMenuRows(FALLBACK_MENU);
  }
}

/**
 * Initialize menu repository from database.js
 */
function initializeMenuRepository() {
  const dbScript = document.getElementById('supabase-db');
  const apiKey = dbScript?.dataset?.apikey;

  if (typeof window.SupabaseMenuRepository !== 'undefined' && apiKey) {
    try {
      window.menuRepository = new window.SupabaseMenuRepository(apiKey);
      console.log('✅ MenuRepository initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize MenuRepository:', error);
      return false;
    }
  }

  console.warn('⚠️ SupabaseMenuRepository not available yet');
  return false;
}

// ─── Event Listeners ──────────────────────────────────────────────

// Route changes (hash changes)
window.addEventListener('hashchange', async () => {
  await loadRoute();
  setActiveMenuItem();
  closeAllDropdowns();
});

// DOM ready
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize menu repository
  const initialized = initializeMenuRepository();

  // If not initialized on first attempt, try again after a short delay
  if (!initialized) {
    await new Promise(resolve => setTimeout(resolve, 300));
    initializeMenuRepository();
  }

  // Render menu
  await renderMenu();

  // Load initial route
  await loadRoute();
  setActiveMenuItem();
});

// Export for debugging
export { normalizeRoute, renderMenu, initializeMenuRepository };