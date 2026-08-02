import { API_BASE } from "./apiConfig.js";

export async function getMenuItems() {
  const response = await fetch(`${API_BASE}/api/menuitems`);

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || [];
}
