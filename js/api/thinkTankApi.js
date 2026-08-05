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

export async function createThinkTankPost({ memberId, category, body, imageUrl = null }) {
  const response = await fetch(`${API_BASE}/api/ForumModeration/submit-post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      memberId,
      category,
      body,
      imageUrl
    })
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result;
}

export async function createThinkTankComment({ postId, memberId, commentText }) {
  const response = await fetch(`${API_BASE}/api/ForumModeration/submit-comment`, {
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

  return result;
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

export async function updateOwnPost({ postId, memberId, password, body }) {
  const response = await fetch(`${API_BASE}/api/posts/${postId}/self`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ memberId, password, body })
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

export async function deleteOwnPost({ postId, memberId, password }) {
  const params = new URLSearchParams({
    memberId: String(memberId),
    password
  });

  const response = await fetch(`${API_BASE}/api/posts/${postId}/self?${params.toString()}`, {
    method: "DELETE"
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data === true;
}

export async function updateOwnComment({ commentId, memberId, password, commentText }) {
  const response = await fetch(`${API_BASE}/api/postcomments/${commentId}/self`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ memberId, password, commentText })
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

export async function deleteOwnComment({ commentId, memberId, password }) {
  const params = new URLSearchParams({
    memberId: String(memberId),
    password
  });

  const response = await fetch(`${API_BASE}/api/postcomments/${commentId}/self?${params.toString()}`, {
    method: "DELETE"
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (result?.error) {
    throw new Error(result.error);
  }

  return result?.data === true;
}