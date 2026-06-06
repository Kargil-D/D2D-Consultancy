"use client";

/**
 * Admin API client.
 *
 * Currently localStorage-backed (browser only) so the admin UI is fully
 * functional without a backend. Swap each `localRepo<T>` call with a real
 * `fetch("/api/admin/...")` call against the .NET API when it's ready —
 * the response shape (ApiResponse<T>) is already standardised.
 */

import type {
  AdminDestination,
  AdminEnquiryConfig,
  AdminHeroConfig,
  AdminItinerary,
  AdminPackage,
  AdminReview,
  ApiResponse,
  Paginated,
} from "@/types/admin";

const KEY = (entity: string) => `d2d.admin.${entity}`;

const isBrowser = () => typeof window !== "undefined";

function read<T>(entity: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY(entity));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(entity: string, list: T[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY(entity), JSON.stringify(list));
}

function ok<T>(data: T, message = "OK"): ApiResponse<T> {
  return { success: true, message, data };
}

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

interface ListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
  filter?: Record<string, unknown>;
}

function paginate<T>(
  list: T[],
  query: ListQuery,
  searchableKeys: (keyof T)[],
): Paginated<T> {
  const { search = "", page = 1, pageSize = 10, filter = {} } = query;
  let result = [...list];

  // Filters
  for (const [k, v] of Object.entries(filter)) {
    if (v === undefined || v === null || v === "") continue;
    result = result.filter(
      (item) => (item as unknown as Record<string, unknown>)[k] === v,
    );
  }

  // Search
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter((item) =>
      searchableKeys.some((key) =>
        String((item as unknown as Record<string, unknown>)[key as string] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }

  const total = result.length;
  const start = (page - 1) * pageSize;
  const items = result.slice(start, start + pageSize);
  return { items, total, page, pageSize };
}

function repo<T extends { id: string }>(
  entity: string,
  searchableKeys: (keyof T)[],
) {
  return {
    list: async (
      query: ListQuery = {},
    ): Promise<ApiResponse<Paginated<T>>> => {
      return ok(paginate(read<T>(entity), query, searchableKeys));
    },
    all: async (): Promise<ApiResponse<T[]>> => ok(read<T>(entity)),
    get: async (recordId: string): Promise<ApiResponse<T | null>> => {
      const item = read<T>(entity).find((r) => r.id === recordId) ?? null;
      return ok(item);
    },
    create: async (
      payload: Omit<T, "id" | "createdDate" | "updatedDate">,
    ): Promise<ApiResponse<T>> => {
      const list = read<T>(entity);
      const record = {
        ...payload,
        id: id(),
        createdDate: nowIso(),
        updatedDate: nowIso(),
        isDeleted: false,
      } as unknown as T;
      list.unshift(record);
      write(entity, list);
      return ok(record, "Created successfully");
    },
    update: async (
      recordId: string,
      payload: Partial<T>,
    ): Promise<ApiResponse<T | null>> => {
      const list = read<T>(entity);
      const idx = list.findIndex((r) => r.id === recordId);
      if (idx === -1) return ok(null, "Not found");
      const updated = {
        ...list[idx],
        ...payload,
        id: list[idx].id,
        updatedDate: nowIso(),
      } as T;
      list[idx] = updated;
      write(entity, list);
      return ok(updated, "Updated successfully");
    },
    remove: async (recordId: string): Promise<ApiResponse<boolean>> => {
      const list = read<T>(entity);
      const next = list.filter((r) => r.id !== recordId);
      write(entity, next);
      return ok(true, "Deleted successfully");
    },
    toggleStatus: async (recordId: string): Promise<ApiResponse<T | null>> => {
      const list = read<T>(entity);
      const idx = list.findIndex((r) => r.id === recordId);
      if (idx === -1) return ok(null, "Not found");
      const current = list[idx] as unknown as { status: "Active" | "Inactive" };
      const updated = {
        ...list[idx],
        status: current.status === "Active" ? "Inactive" : "Active",
        updatedDate: nowIso(),
      } as T;
      list[idx] = updated;
      write(entity, list);
      return ok(updated, "Status updated");
    },
    seed: (rows: T[]) => {
      if (read<T>(entity).length === 0) write(entity, rows);
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Repositories                                                               */
/* -------------------------------------------------------------------------- */

export const destinationsApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminDestination>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const country = query.filter?.country;
    if (typeof country === "string") params.set("country", country);
    const res = await fetch(`/api/admin/destinations?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminDestination>>;
  },
  all: async (): Promise<ApiResponse<AdminDestination[]>> => {
    const res = await fetch(`/api/admin/destinations?page=1&pageSize=1000`);
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data.items };
  },
  get: async (id: string): Promise<ApiResponse<AdminDestination | null>> => {
    const res = await fetch(`/api/admin/destinations/${id}`);
    return (await res.json()) as ApiResponse<AdminDestination | null>;
  },
  create: async (payload: Omit<AdminDestination, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminDestination>> => {
    const res = await fetch(`/api/admin/destinations`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminDestination>;
  },
  update: async (id: string, payload: Partial<AdminDestination>): Promise<ApiResponse<AdminDestination | null>> => {
    const res = await fetch(`/api/admin/destinations/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminDestination | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/destinations/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminDestination | null>> => {
    const res = await fetch(`/api/admin/destinations/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminDestination | null>;
  },
  seed: (_rows: AdminDestination[]) => {
    // no-op for server-backed API
  },
};

export const packagesApi = repo<AdminPackage>("packages", [
  "name",
  "packageType",
  "shortDescription",
]);

export const itinerariesApi = repo<AdminItinerary>("itineraries", [
  "title",
  "overview",
]);

export const heroApi = repo<AdminHeroConfig>("hero", ["bannerText", "subtitle"]);

export const reviewsApi = repo<AdminReview>("reviews", [
  "customerName",
  "reviewText",
]);

export const enquiryConfigApi = repo<AdminEnquiryConfig>("enquiryConfig", [
  "destinationId",
]);

/* -------------------------------------------------------------------------- */
/*  Image upload (mock — converts file to data URL)                            */
/* -------------------------------------------------------------------------- */

export function uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(ok({ url: String(reader.result) }, "Uploaded"));
    reader.readAsDataURL(file);
  });
}
