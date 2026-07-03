import { API_BASE } from "./apiConfig.js";

export async function createEventForm(eventForm) {
  const response = await fetch(`${API_BASE}/api/eventforms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventForm)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  console.log("Event Form API:", result);

  return result?.data || null;
}