import { API_BASE } from "./apiConfig.js";

export async function getAlumniEvents() {
  const response = await fetch(`${API_BASE}/api/alumnievents`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  console.log("Alumni Events API:", result);

  return result.data || [];
}