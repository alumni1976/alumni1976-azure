import { API_BASE } from "./apiConfig.js";

export async function createContactForm(contactForm) {
  const response = await fetch(`${API_BASE}/api/contactforms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(contactForm)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  console.log("Contact Form API:", result);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}