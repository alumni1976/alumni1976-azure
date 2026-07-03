import { API_BASE } from "./apiConfig.js";

export async function getReunionData() {
    const response = await fetch(`${API_BASE}/api/reunion1976`);

    if (!response.ok) {
        throw new Error("Cannot load reunion data.");
    }

    const result = await response.json();
    return result.data ?? [];
}