import { API_BASE } from "./apiConfig.js";

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

  console.log("Evaluation API:", result);

  return result;
}
