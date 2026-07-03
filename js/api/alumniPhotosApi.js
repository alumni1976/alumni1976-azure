import { API_BASE } from "./apiConfig.js";

export async function getAlumniPhotos() {
  const response = await fetch(`${API_BASE}/api/alumniphotos`);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  console.log("Alumni Photos API:", result);

  return result.data || [];
}