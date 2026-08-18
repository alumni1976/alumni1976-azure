import { API_BASE } from "./apiConfig.js";

export async function login(email, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || `HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || null;
}
