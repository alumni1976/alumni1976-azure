import { API_BASE } from "./apiConfig.js";
import { getToken } from "../auth.js";

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJson(response) {
  return await response.json().catch(() => null);
}

export async function getMembers() {
  const response = await fetch(`${API_BASE}/api/members`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const result = await response.json();
  return result.data || [];
}

/**
 * Self-service: get the signed-in member's own editable card.
 * Backend: GET /api/members/self (JWT required)
 */
export async function getOwnMember() {
  const response = await fetch(`${API_BASE}/api/members/self`, {
    headers: authHeaders()
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data || null;
}

/**
 * Self-service: update the signed-in member's own editable fields.
 * Backend: PUT /api/members/self (JWT required)
 * fields: { firstName, lastName, vocativeFirstName, vocativeLastName,
 *           email, phone, address, city, country, birthDate,
 *           initials, remarks }
 */
export async function updateOwnMember(fields) {
  const response = await fetch(`${API_BASE}/api/members/self`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(fields)
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data || null;
}

/**
 * Self-service: change the signed-in member's own password.
 * Backend: PUT /api/members/self/password (JWT required)
 * Requires the current password — a valid JWT alone isn't treated as
 * sufficient proof of continued password knowledge.
 */
export async function changeOwnPassword({ currentPassword, newPassword }) {
  const response = await fetch(`${API_BASE}/api/members/self/password`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data === true;
}
