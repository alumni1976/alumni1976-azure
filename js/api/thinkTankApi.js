import { API_BASE } from "./apiConfig.js";
import { getToken } from "../auth.js";

/**
 * This module no longer performs its own login or stores its own token.
 * Auth is entirely owned by the site-wide auth.js (JWT stored under
 * "alumni1976AuthToken" in localStorage). Every authenticated call below
 * reads that token via getToken() and sends it as:
 * Authorization: Bearer <token>
 */

function authHeaders(extra = {}) {
  const token = getToken();
  const headers = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJson(response) {
  return await response.json().catch(() => null);
}

/**
 * Public read endpoint (no JWT required).
 * Backend: GET /api/thinktank/posts
 */
export async function getThinkTankPosts({
  offset = 0,
  limit = 10,
  category = "all",
  memberId = null
} = {}) {
  const params = new URLSearchParams();
  params.set("offset", String(offset));
  params.set("limit", String(limit));
  params.set("category", category || "all");
  if (memberId) params.set("memberId", String(memberId));

  const response = await fetch(`${API_BASE}/api/thinktank/posts?${params.toString()}`);
  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data || [];
}

/**
 * Member-facing create post (JWT required).
 * Backend: POST /api/posts
 * Body: { category, body, imageUrl }
 */
export async function createThinkTankPost({ category, body, imageUrl = null }) {
  const response = await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ category, body, imageUrl })
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  // The controller returns { data, verdict, error } as siblings — thinktank.js
  // reads result.verdict.score, so verdict must survive this call, not just data.
  if (!result?.data) return null;

  return { ...result.data, verdict: result.verdict };
}

/**
 * Member-facing create comment (JWT required).
 * Backend: POST /api/postcomments
 * Body: { postId, commentText }
 */
export async function createThinkTankComment({ postId, commentText }) {
  const response = await fetch(`${API_BASE}/api/postcomments`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ postId, commentText })
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  // Same envelope shape as createThinkTankPost — data and verdict are
  // siblings in the response, so verdict must be carried through here too.
  if (!result?.data) return null;

  return { ...result.data, verdict: result.verdict };
}

/**
 * Like a post (JWT required).
 * Backend: POST /api/postlikes
 * Body: { postId }
 */
export async function likeThinkTankPost({ postId }) {
  const response = await fetch(`${API_BASE}/api/postlikes`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ postId })
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  // alreadyLiked distinguishes a genuine duplicate (still a 200, not an
  // error) from a real failure, which the old code couldn't tell apart.
  return {
    data: result?.data || null,
    alreadyLiked: result?.alreadyLiked === true
  };
}

/**
 * Self edit post (JWT required).
 * Backend: PUT /api/posts/{id}/self
 * Body: { body }
 */
export async function updateOwnPost({ postId, body }) {
  const response = await fetch(`${API_BASE}/api/posts/${postId}/self`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ body })
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data || null;
}

/**
 * Self delete post (JWT required).
 * Backend: DELETE /api/posts/{id}/self
 */
export async function deleteOwnPost({ postId }) {
  const response = await fetch(`${API_BASE}/api/posts/${postId}/self`, {
    method: "DELETE",
    headers: authHeaders()
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data === true;
}

/**
 * Self edit comment (JWT required).
 * Backend: PUT /api/postcomments/{id}/self
 * Body: { commentText }
 */
export async function updateOwnComment({ commentId, commentText }) {
  const response = await fetch(`${API_BASE}/api/postcomments/${commentId}/self`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ commentText })
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data || null;
}

/**
 * Self delete comment (JWT required).
 * Backend: DELETE /api/postcomments/{id}/self
 */
export async function deleteOwnComment({ commentId }) {
  const response = await fetch(`${API_BASE}/api/postcomments/${commentId}/self`, {
    method: "DELETE",
    headers: authHeaders()
  });

  const result = await parseJson(response);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (result?.error) throw new Error(result.error);

  return result?.data === true;
}
