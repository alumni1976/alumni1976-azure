import { API_BASE } from "./api/apiConfig.js";
import { getToken } from "./auth.js";

const VISITOR_ID_KEY = "alumni1976VisitorId";

function generateUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback UUID v4 for older browsers or non-secure contexts where
  // crypto.randomUUID isn't available.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// A first-party, anonymous identifier stored in this browser only — used
// purely to count unique anonymous visitors. Carries no personal data,
// never sent anywhere except this site's own analytics endpoint.
function getOrCreateVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_KEY);

  if (!id) {
    id = generateUuid();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }

  return id;
}

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Fire-and-forget page hit logging. Never throws, never blocks the page —
// analytics failing silently should never affect the user's experience.
// Whether this counts as "read" or "access" mode is decided entirely by
// the backend from the JWT (or lack of one) attached here, not by
// anything passed in the request body.
export function logPageHit(pageRoute) {
  try {
    const visitorId = getOrCreateVisitorId();

    fetch(`${API_BASE}/api/analytics/hit`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ pageRoute, visitorId })
    }).catch(() => {
      // Swallow network errors — analytics is best-effort only.
    });
  } catch {
    // Swallow synchronous errors too, for the same reason.
  }
}
