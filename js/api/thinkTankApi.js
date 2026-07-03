import { API_BASE } from "./apiConfig.js";

export async function loginThinkTank(password) {
  const response = await fetch(`${API_BASE}/api/thinktank/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || null;
}

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

  if (memberId) {
    params.set("memberId", String(memberId));
  }

  const response = await fetch(`${API_BASE}/api/thinktank/posts?${params.toString()}`);

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || [];
}

export async function createThinkTankPost({ memberId, category, body }) {
  const response = await fetch(`${API_BASE}/api/thinktank/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      memberId,
      category,
      body
    })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || null;
}

export async function createThinkTankComment({ postId, memberId, commentText }) {
  const response = await fetch(`${API_BASE}/api/thinktank/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      postId,
      memberId,
      commentText
    })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || null;
}

export async function likeThinkTankPost({ postId, memberId }) {
  const response = await fetch(`${API_BASE}/api/thinktank/likes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      postId,
      memberId
    })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data || null;
}