import { API_BASE } from "./apiConfig.js";

export async function getProfPhotos() {
  const response = await fetch(`${API_BASE}/api/profphotos`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();


  return result.data || [];
}