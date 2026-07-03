/**
 * Supabase Dataset Wrapper
 * Provides consistent data access patterns across the application
 */
class SupabaseDataset {
  constructor(dataArray = []) {
    this.items = dataArray;
    this._index = 0;
  }

  isEmpty() {
    return !this.items || this.items.length === 0;
  }

  get length() {
    return this.items?.length || 0;
  }

  /**
   * Find first item matching predicate
   */
  find(predicate) {
    return this.items?.find(predicate) || null;
  }

  /**
   * Filter items by predicate
   */
  filter(predicate) {
    return new SupabaseDataset(this.items?.filter(predicate) || []);
  }

  /**
   * Map items to new values
   */
  map(fn) {
    return this.items?.map(fn) || [];
  }

  /**
   * Get item at index
   */
  at(index) {
    return this.items?.[index] || null;
  }

  /**
   * Iterator support (for...of loops)
   */
  [Symbol.iterator]() {
    this._index = 0;
    return this;
  }

  next() {
    if (this._index < this.items.length) {
      return { value: this.items[this._index++], done: false };
    }
    return { done: true };
  }

  /**
   * Convert to plain array
   */
  toArray() {
    return [...(this.items || [])];
  }
}

class SupabaseMenuRepository {
  /**
   * @param {string} apiKey - Supabase publishable/anonymouse key
   * @param {Object} options - Configuration options
   * @param {string} options.sqlQuery - SELECT/ORDER clause
   * @param {string} options.baseUrl - Supabase API base URL
   */
  constructor(apiKey, options = {}) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Supabase API key is required');
    }

    this.apiKey = apiKey.trim();

    // Get SQL query from data attribute or use default
    const dbScript = document.getElementById('supabase-db');
    this.sqlQuery = options.sqlQuery ||
      (dbScript?.dataset?.sql) ||
      'select=item,url&order=id.asc';

    // Allow overriding base URL for testing
    this.baseUrl = options.baseUrl ||
      'https://hpnrlshfxxcyujrxegka.supabase.co';

    // Track pending requests for deduplication
    this._pendingRequests = new Map();
  }

  /**
   * Generic fetch with error handling, retries, and deduplication
   */
  async fetchData(path, options = {}) {
    const {
      retries = 2,
      retryDelay = 1000,
      signal = null
    } = options;

    const apiUrl = this.baseUrl + path;

    // Deduplicate identical in-flight requests
    const requestKey = `${path}`;
    if (this._pendingRequests.has(requestKey)) {
      return this._pendingRequests.get(requestKey);
    }

    const executeRequest = async (attempt = 0) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            apikey: this.apiKey,
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: signal || controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle rate limiting with exponential backoff
          if (response.status === 429 && attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt);
            console.warn(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return executeRequest(attempt + 1);
          }

          if (response.status === 404) {
            console.warn('Resource not found:', apiUrl);
            return new SupabaseDataset([]);
          }

          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json();
        return new SupabaseDataset(rawData);

      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Request timeout for:', apiUrl);
          return new SupabaseDataset([]);
        }

        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          console.warn(`Retry ${attempt + 1}/${retries} after ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        }

        console.error('Fetch failed after retries:', error);
        return new SupabaseDataset([]);
      }
    };

    const promise = executeRequest();
    this._pendingRequests.set(requestKey, promise);

    // Clean up after request completes
    promise.finally(() => {
      this._pendingRequests.delete(requestKey);
    });

    return promise;
  }

  /**
   * Fetch menu items from the menuitems table
   */
  async fetchMenuData(tableName = 'menuitems') {
    return this.fetchData(
      `/rest/v1/${tableName}?${this.sqlQuery}`
    );
  }

  /**
   * Fetch all members with specific fields
   */
  async fetchMembers() {
    return this.fetchData(
      '/rest/v1/members' +
      '?select=id,first_name,last_name,email,phone,address,cv_link_clord,media_link_clord,photo_link_clord,status' +
      '&order=last_name.asc'
    );
  }

  /**
   * Fetch member by ID
   */
  async fetchMemberById(id) {
    if (!id) return new SupabaseDataset([]);
    return this.fetchData(
      `/rest/v1/members?select=*&id=eq.${encodeURIComponent(id)}`
    );
  }

  /**
   * Clear pending request cache
   */
  clearCache() {
    this._pendingRequests.clear();
  }
}

// Expose to global scope for legacy script access
window.SupabaseDataset = SupabaseDataset;
window.SupabaseMenuRepository = SupabaseMenuRepository;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseDataset, SupabaseMenuRepository };
}