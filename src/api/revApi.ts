import type { RevSummary, Rev } from "../lib/revTypes";

const API_BASE = 'http://localhost:4000'

export async function fetchMeshSummary(): Promise<RevSummary[]> {
    const res = await fetch(`${API_BASE}/mesh`);
    if (!res.ok) throw new Error("Failed to fetch mesh");
    return res.json();
}

export async function fetchRevById(id: string): Promise<Rev> {
    const res = await fetch(`${API_BASE}/mesh/rev/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch .rev: ${id}`);
    return res.json();
}