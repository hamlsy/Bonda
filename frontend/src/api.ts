import type { Bond, CreateHolding, Holding, WatchlistEntry } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getBonds(signal?: AbortSignal) {
  return request<Bond[]>("/api/bonds", { signal });
}

export function getHoldings(signal?: AbortSignal) {
  return request<Holding[]>("/api/holdings", { signal });
}

export function getWatchlist(signal?: AbortSignal) {
  return request<WatchlistEntry[]>("/api/watchlist", { signal });
}

export function createHolding(input: CreateHolding) {
  return request<Holding>("/api/holdings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createWatchlist(bondId: number) {
  return request<WatchlistEntry>("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ bondId }),
  });
}
