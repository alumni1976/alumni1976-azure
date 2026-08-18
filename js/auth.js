import { login as loginApi } from "./api/authApi.js";

const TOKEN_KEY = "alumni1976AuthToken";
const USER_KEY = "alumni1976AuthUser";

// Using localStorage (not sessionStorage) deliberately — the JWT itself
// is issued with a 7-day expiry, meaning the intent is for someone to
// stay logged in across browser sessions, not just the current tab.

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

export async function login(email, password) {
  const data = await loginApi(email, password);

  if (!data?.token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  const user = {
    memberId: data.memberId,
    firstName: data.firstName,
    lastName: data.lastName,
    vocativeFirstName: data.vocativeFirstName,
    vocativeLastName: data.vocativeLastName,
    photoLink: data.photoLink,
    accessLevel: data.accessLevel
  };

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  window.dispatchEvent(new CustomEvent("authchange", { detail: { loggedIn: true, user } }));

  return user;
}

// Merges a partial update (e.g. from a self-service profile save) into
// the cached user without a full re-login — used so the nav's welcome
// text/label reflects a name change immediately. No-op if not logged in.
export function updateCurrentUser(partial) {
  const current = getCurrentUser();

  if (!current) return null;

  const updated = { ...current, ...partial };

  localStorage.setItem(USER_KEY, JSON.stringify(updated));

  window.dispatchEvent(new CustomEvent("authchange", { detail: { loggedIn: true, user: updated } }));

  return updated;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  window.dispatchEvent(new CustomEvent("authchange", { detail: { loggedIn: false, user: null } }));
}
