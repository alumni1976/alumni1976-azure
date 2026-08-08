import { API_BASE } from "./apiConfig.js";

// ============================================
// EXISTING: Combined Evaluation (keep for backward compatibility)
// ============================================
export async function createEvaluation(evaluation) {
  const response = await fetch(`${API_BASE}/api/EventWebsiteEvaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(evaluation)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

// ============================================
// NEW: Website Evaluation (separate)
// ============================================
export async function createWebsiteEvaluation(evaluation) {
  const response = await fetch(`${API_BASE}/api/WebsiteEvaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(evaluation)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

// ============================================
// NEW: Reunion Evaluation (separate)
// ============================================
export async function createReunionEvaluation(evaluation) {
  const response = await fetch(`${API_BASE}/api/ReunionEvaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(evaluation)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

// ============================================
// NEW: Admin Functions - Get All Evaluations
// ============================================
export async function getWebsiteEvaluations() {
  const response = await fetch(`${API_BASE}/api/WebsiteEvaluations`);
  
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

export async function getReunionEvaluations() {
  const response = await fetch(`${API_BASE}/api/ReunionEvaluations`);
  
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

// ============================================
// NEW: Admin Functions - Get Single Evaluation
// ============================================
export async function getWebsiteEvaluationById(id) {
  const response = await fetch(`${API_BASE}/api/WebsiteEvaluations/${id}`);
  
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

export async function getReunionEvaluationById(id) {
  const response = await fetch(`${API_BASE}/api/ReunionEvaluations/${id}`);
  
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

// ============================================
// NEW: Admin Functions - Update Evaluations
// ============================================
export async function updateWebsiteEvaluation(id, evaluation) {
  const response = await fetch(`${API_BASE}/api/WebsiteEvaluations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(evaluation)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

export async function updateReunionEvaluation(id, evaluation) {
  const response = await fetch(`${API_BASE}/api/ReunionEvaluations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(evaluation)
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

// ============================================
// NEW: Admin Functions - Delete Evaluations
// ============================================
export async function deleteWebsiteEvaluation(id) {
  const response = await fetch(`${API_BASE}/api/WebsiteEvaluations/${id}`, {
    method: "DELETE"
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}

export async function deleteReunionEvaluation(id) {
  const response = await fetch(`${API_BASE}/api/ReunionEvaluations/${id}`, {
    method: "DELETE"
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}`);
  }

  return result;
}