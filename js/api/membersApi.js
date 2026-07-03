import { API_BASE } from "./apiConfig.js";

export async function getMembers() {

    const response = await fetch(`${API_BASE}/api/members`);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log("Members API:", result);

    return result.data || [];
}