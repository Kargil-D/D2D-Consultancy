"use client";

import type { ApiResponse } from "@/types/admin";

/**
 * Small reusable fetch wrapper for client components. Kept fetch-based (not
 * axios) to stay consistent with every other client-side call in the repo
 * (see src/lib/adminApi.ts). Always sends credentials so httpOnly auth
 * cookies are included, and unwraps the { success, message, data } envelope,
 * throwing on failure so callers can just await + try/catch.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const json = (await res.json().catch(() => ({}))) as Partial<ApiResponse<T>>;

  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? "Request failed. Please try again.");
  }

  return json.data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
};
