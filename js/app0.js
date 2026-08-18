import { loadRoute } from './router.js';
import { loadTexts } from './services/textService.js';
import { getMenuItems, getSubMenuItems } from './api/menuApi.js';
import { login, logout, getCurrentUser } from './auth.js';

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
  {
    item: 'ΑΞΙΟΛΟΓΗΣΗ',
    url: 'evaluation',
    children: [
      { item: 'ΙΣΤΟΤΟΠΟΣ', url: 'website-evaluation' },
      { item: 'REUNION50', url: 'reunion-evaluation' }
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
 * Close all open dropdown menus. The dropdown-menu itself is a direct
 * child of <body> (see the "portal" comment in renderMenuRows below),
 * so it's no longer a DOM descendant of its .has-dropdown <li> — both
 * need their .open class cleared independently.
 */
function closeAllDropdowns() {
  document.querySelectorAll('#menu .has-dropdown')
    .forEach(li => li.classList.remove('open'));

  document.querySelectorAll('.dropdown-menu.open')
    .forEach(dropdownMenu => dropdownMenu.classList.remove('open'));
}

/**
 * Position a fixed-position dropdown menu directly below its toggle
 * link, using viewport coordinates. .dropdown-menu is position:fixed
 * AND moved to be a direct child of <body> — needed because nav has
 * backdrop-filter, and any ancestor with transform/filter/backdrop-
 * filter creates a new containing block for fixed-position descendants
 * in modern browsers, silently making position:fixed relative to that
 * ancestor instead of the viewport. Moving it out of nav entirely
 * avoids this regardless of which ancestor property might trigger it.
 */
function positionDropdown(toggle, dropdownMenu) {
  if (!toggle || !dropdownMenu) return;

  const rect = toggle.getBoundingClientRect();
  const menuWidth = dropdownMenu.offsetWidth || 220;

  let left = rect.left + (rect.width / 2) - (menuWidth / 2);
  left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));

  dropdownMenu.style.top = `${rect.bottom + 6}px`;
  dropdownMenu.style.left = `${left}px`;
}

/**
 * Keep an open dropdown aligned with its toggle link while the page
 * scrolls or the window resizes (since it's fixed to the viewport).
 * The toggle reference is stashed directly on the dropdown-menu
 * element at build time (see renderMenuRows), since DOM-nesting-based
 * lookup no longer works once it's moved under <body>.
 */
function repositionOpenDropdown() {
  const openDropdown = document.querySelector('.dropdown-menu.open');
  if (!openDropdown) return;

  positionDropdown(openDropdown._toggleEl, openDropdown);
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

  // Attach dropdown toggle events. Each .dropdown-menu is moved to be
  // a direct child of <body> — see the comment on positionDropdown()
  // above for why (nav's backdrop-filter otherwise silently breaks
  // position:fixed coordinates). The toggle reference is stashed as a
  // plain JS property on the moved element, since it can no longer be
  // found via DOM nesting once it's outside its original <li>.
  menu.querySelectorAll('.has-dropdown').forEach(li => {
    const toggle = li.querySelector('.dropdown-toggle');
    const dropdownMenu = li.querySelector('.dropdown-menu');

    if (toggle && dropdownMenu) {
      dropdownMenu._toggleEl = toggle;
      document.body.appendChild(dropdownMenu);

      toggle.addEventListener('click', (e) => {
        const isOpen = dropdownMenu.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) {
          e.preventDefault();
          positionDropdown(toggle, dropdownMenu);
          li.classList.add('open');
          dropdownMenu.classList.add('open');
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

  // Re-position any open dropdown on scroll/resize, since it's fixed
  // relative to the viewport, not the (scrollable) nav item anymore.
  window.addEventListener('scroll', repositionOpenDropdown, { passive: true });
  window.addEventListener('resize', repositionOpenDropdown);

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
      const [items, subItems] = await Promise.all([
        getMenuItems(),
        getSubMenuItems().catch(() => [])
      ]);

      if (items?.length) {
        renderMenuRows(groupMenuWithChildren(items, subItems));
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

// Group flat sub-menu rows under their parent by matching ParentItem
// against the parent's Item text — same convention already proven in
// the admin app's buildAdminMenu()/subMap grouping.
// Group flat sub-menu rows under their parent, matching on the real
// ParentId foreign key (menuitems.id). Falls back to the old text-
// match (ParentItem vs item.item) only if parentId is missing — e.g.
// during the migration window before the SQL backfill has run, or
// for any row that hasn't been given a parentId yet.
function groupMenuWithChildren(items, subItems) {
  const subMapById = new Map();
  const subMapByText = new Map();

  (subItems || []).forEach(subItem => {
    if (subItem.parentId != null) {
      const key = String(subItem.parentId);
      if (!subMapById.has(key)) subMapById.set(key, []);
      subMapById.get(key).push(subItem);
    } else {
      const key = subItem.parentItem;
      if (!subMapByText.has(key)) subMapByText.set(key, []);
      subMapByText.get(key).push(subItem);
    }
  });

  return items.map(item => {
    const children = subMapById.get(String(item.id)) || subMapByText.get(item.item);
    return children?.length ? { ...item, children } : item;
  });
}

// ─── Site-wide auth widget (nav flyout) ────────────────────────────

function initAuthWidget() {
  const toggleBtn = document.getElementById('authToggleBtn');
  const toggleLabel = document.getElementById('authToggleLabel');
  const flyout = document.getElementById('authFlyout');
  const loggedOutView = document.getElementById('authFlyoutLoggedOut');
  const loggedInView = document.getElementById('authFlyoutLoggedIn');
  const welcomeText = document.getElementById('authWelcomeText');
  const emailInput = document.getElementById('authEmail');
  const passwordInput = document.getElementById('authPassword');
  const loginBtn = document.getElementById('authLoginBtn');
  const logoutBtn = document.getElementById('authLogoutBtn');
  const messageEl = document.getElementById('authMessage');

  if (!toggleBtn || !flyout) return;

  function refreshAuthUI() {
    const user = getCurrentUser();

    if (user) {
      const buttonName = user.firstName || 'Λογαριασμός';
      const welcomeName = user.vocativeFirstName || user.firstName || 'Λογαριασμός';
      toggleLabel.textContent = buttonName;
      loggedOutView?.classList.add('hidden');
      loggedInView?.classList.remove('hidden');
      if (welcomeText) welcomeText.textContent = `Καλώς ήρθες, ${welcomeName}`;
    } else {
      toggleLabel.textContent = 'Σύνδεση';
      loggedOutView?.classList.remove('hidden');
      loggedInView?.classList.add('hidden');
    }
  }

  // Positions the flyout relative to the viewport (it's a direct child
  // of <body>, outside nav, so nav's backdrop-filter never affects it —
  // same reasoning as the menu dropdown fix).
  function positionFlyout() {
    const rect = toggleBtn.getBoundingClientRect();
    const flyoutWidth = flyout.offsetWidth || 300;

    let left = rect.right - flyoutWidth;
    left = Math.max(8, Math.min(left, window.innerWidth - flyoutWidth - 8));

    flyout.style.top = `${rect.bottom + 8}px`;
    flyout.style.left = `${left}px`;
  }

  function openFlyout() {
    flyout.classList.remove('hidden');
    positionFlyout();
  }

  function closeFlyout() {
    flyout.classList.add('hidden');
    if (messageEl) messageEl.textContent = '';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (flyout.classList.contains('hidden')) {
      openFlyout();
    } else {
      closeFlyout();
    }
  });

  document.addEventListener('click', (e) => {
    if (!flyout.classList.contains('hidden') &&
        !flyout.contains(e.target) &&
        e.target !== toggleBtn) {
      closeFlyout();
    }
  });

  window.addEventListener('scroll', () => {
    if (!flyout.classList.contains('hidden')) positionFlyout();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!flyout.classList.contains('hidden')) positionFlyout();
  });

  loginBtn?.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      messageEl.textContent = 'Συμπληρώστε email και κωδικό.';
      return;
    }

    loginBtn.disabled = true;
    messageEl.textContent = 'Σύνδεση...';

    try {
      await login(email, password);
      passwordInput.value = '';
      refreshAuthUI();
      closeFlyout();
    } catch (err) {
      messageEl.textContent = err?.message || 'Αποτυχία σύνδεσης.';
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn?.addEventListener('click', () => {
    logout();
    refreshAuthUI();
    closeFlyout();
  });

  window.addEventListener('authchange', refreshAuthUI);

  refreshAuthUI();
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

  // Auth widget (site-wide login)
  initAuthWidget();

  // Load initial route
  await loadRoute();
  setActiveMenuItem();
});

// Export for debugging
export { normalizeRoute, renderMenu };
