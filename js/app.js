import { loadRoute } from './router.js';
import { loadTexts } from './services/textService.js';
import { getMenuItems } from './api/menuApi.js';

/**
 * Configuration
 */
const CONFIG = {
  // Maximum retry attempts for menu loading
  maxMenuRetries: 2,
  // Delay between menu retry attempts (ms)
  menuRetryDelay: 1000
};

/**
 * Fallback menu structure - used when the API is unavailable.
 * Mirrors the live /api/menuitems rows. Note "Reunion 1976" is
 * intentionally NOT here — it's a standalone pill link in the nav
 * (see index.html .reunion-link), and its sub-pages are reachable
 * from the reunion hub page's own nav cards, not from this menu.
 */
const FALLBACK_MENU = [
  { item: 'Αρχική', url: 'home' },
  { item: 'Κοινότητα', url: 'community' },
  { item: 'Φωτογραφίες', url: 'alumniphotos' },
  { item: 'Καθηγητές', url: 'alumniprofs' },
  { item: 'Εκδηλώσεις', url: 'alumnievents' },
  { item: 'Επικοινωνία', url: 'contact' },
  { item: 'Ευρετήριο', url: 'directory' },
  { item: 'Δεξαμενή σκέψεων', url: 'thinktank' },
  { item: 'ΣΥΧΝΕΣ ΕΡΩΤΗΣΕΙΣ', url: 'faq' },
  { item: 'Αξιολόγηση', url: 'evaluation' }
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
 * Render menu from data rows.
 * Rows are flat ({ item, url }) for the current API, but a row
 * with a non-empty `children` array will still render as a
 * dropdown, in case a parent/child menu is added later.
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
 * Load menu data from the SQL-backed Web API, with a flat fallback
 * if the API is unreachable.
 */
async function renderMenu() {
  let attempts = 0;

  while (attempts <= CONFIG.maxMenuRetries) {
    try {
      const items = await getMenuItems();

      if (items?.length) {
        renderMenuRows(items);
        return;
      }

      attempts++;
    } catch (error) {
      console.warn(`Menu load attempt ${attempts + 1} failed:`, error.message);
      attempts++;
    }

    if (attempts <= CONFIG.maxMenuRetries) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.menuRetryDelay));
    }
  }

  console.warn('All menu load attempts failed, using fallback');
  renderMenuRows(FALLBACK_MENU);
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
  // Load user-facing texts
  await loadTexts();

  // Render menu
  await renderMenu();

  // Load initial route
  await loadRoute();
  setActiveMenuItem();
});

// Export for debugging
export { normalizeRoute, renderMenu };
