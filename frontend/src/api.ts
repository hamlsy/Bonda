import type {
  Bond,
  CreateHolding,
  Holding,
  RiskEventDetail,
  SinceBoughtResponse,
  AlertItem,
  MyBondSummary,
  HistoricalReplayResponse,
  WatchlistEntry,
} from "./types";

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

export function getMyBonds(signal?: AbortSignal) {
  return request<MyBondSummary[]>("/api/holdings/summary", { signal });
}

export function getAlerts(signal?: AbortSignal, unreadOnly = false, limit = 20) {
  const query = new URLSearchParams({ unreadOnly: String(unreadOnly), limit: String(limit) });
  return request<AlertItem[]>(`/api/alerts?${query}`, { signal });
}

export function markAlertRead(alertId: number) {
  return request<AlertItem>(`/api/alerts/${alertId}/read`, { method: "PATCH" });
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

export function getSinceBought(holdingId: number, signal?: AbortSignal) {
  return request<SinceBoughtResponse>(`/api/holdings/${holdingId}/since-bought`, { signal });
}

export function getRiskEvent(riskEventId: number, signal?: AbortSignal) {
  return request<RiskEventDetail>(`/api/risk-events/${riskEventId}`, { signal });
}

export function runHistoricalReplay(issuerId: number, cutoffDate: string, signal?: AbortSignal) {
  return request<HistoricalReplayResponse>("/api/admin/replay", {
    method: "POST",
    body: JSON.stringify({ issuerId, cutoffDate }),
    signal,
  });
}
