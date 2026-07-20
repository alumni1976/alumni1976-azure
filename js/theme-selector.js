/**
 * Theme management for Alumni 1976 site
 * Stores preference in localStorage for persistence
 */

const THEME_STORAGE_KEY = 'alumni1976Theme';

const THEMES = [
  'style-deep-navy-university',
  'style-academic-gold',
  'style-engineering-tech',
  'style-executive-alumni',
  'style-polytechnic-heritage',
  'style-modern-minimal'
];

const DEFAULT_THEME = 'style-deep-navy-university';

// Theme display names for UI
const THEME_LABELS = {
  'style-deep-navy-university': 'Deep Navy University',
  'style-academic-gold': 'Academic Gold',
  'style-engineering-tech': 'Engineering Tech',
  'style-executive-alumni': 'Executive Alumni',
  'style-polytechnic-heritage': 'Polytechnic Heritage',
  'style-modern-minimal': 'Modern Minimal'
};

/**
 * Normalize theme value — ensures it's a valid theme
 */
function normalizeTheme(theme) {
  if (!theme) return DEFAULT_THEME;
  return THEMES.includes(theme) ? theme : DEFAULT_THEME;
}

/**
 * Apply theme to the document
 */
function applyTheme(theme) {
  const selectedTheme = normalizeTheme(theme);

  // Remove all theme classes from body
  document.body.classList.remove(...THEMES);
  // Add the selected theme
  document.body.classList.add(selectedTheme);

  // Set data attribute on html for CSS hooks
  document.documentElement.dataset.theme = selectedTheme;

  // Save to localStorage
  try {
    localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  } catch (e) {
    // localStorage unavailable (incognito, etc.) — silently skip
  }

  // Update selector dropdown if it exists
  const selector = document.getElementById('themeSelector');
  if (selector) {
    selector.value = selectedTheme;
  }
}

/**
 * Get the current active theme
 */
function getCurrentTheme() {
  return normalizeTheme(
    document.body.className
      .split(' ')
      .find(cls => THEMES.includes(cls)) ||
    localStorage.getItem(THEME_STORAGE_KEY) ||
    DEFAULT_THEME
  );
}

/**
 * Initialize theme selector with saved or default theme
 */
function initThemeSelector() {
  // Get saved theme or default
  const savedTheme = normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  applyTheme(savedTheme);

  const selector = document.getElementById('themeSelector');
  if (!selector) return;

  // Populate dropdown with all themes (if not already populated)
  if (selector.options.length <= 1) {
    THEMES.forEach(theme => {
      const opt = document.createElement('option');
      opt.value = theme;
      opt.textContent = THEME_LABELS[theme] || theme;
      selector.appendChild(opt);
    });
    selector.value = getCurrentTheme();
  }

  // Listen for changes
  selector.addEventListener('change', () => {
    applyTheme(selector.value);

    // Optional: dispatch event for other components to react
    document.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: selector.value }
    }));
  });
}

/**
 * Toggle theme (for keyboard shortcuts or testing)
 */
function toggleTheme() {
  const current = getCurrentTheme();
  const currentIndex = THEMES.indexOf(current);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  applyTheme(THEMES[nextIndex]);
}

/**
 * Reset theme to default
 */
function resetTheme() {
  applyTheme(DEFAULT_THEME);
}

// ─── Automatic Initialization ─────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeSelector);
} else {
  // DOM already loaded — initialize immediately
  // Use setTimeout to avoid blocking other scripts
  setTimeout(initThemeSelector, 0);
}

// ─── Expose for debugging ──────────────────────────────────────────

window.__theme = {
  THEMES,
  DEFAULT_THEME,
  getCurrent: getCurrentTheme,
  apply: applyTheme,
  toggle: toggleTheme,
  reset: resetTheme
};

// ─── Export for modules ────────────────────────────────────────────

export {
  THEMES,
  DEFAULT_THEME,
  THEME_LABELS,
  normalizeTheme,
  applyTheme,
  getCurrentTheme,
  initThemeSelector,
  toggleTheme,
  resetTheme
};