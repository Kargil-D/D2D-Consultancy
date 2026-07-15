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
  AdminHotel,
  AdminItinerary,
  AdminLead,
  AdminPackage,
  AdminReview,
  AdminSalesUser,
  AdminTransfer,
  AdminTransferType,
  ApiResponse,
  LeadStatus,
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

export const leadsApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminLead>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const { source, status, assignedToId } = query.filter ?? {};
    if (typeof source === "string") params.set("source", source);
    if (typeof status === "string") params.set("status", status);
    if (typeof assignedToId === "string") params.set("assignedToId", assignedToId);
    const res = await fetch(`/api/admin/leads?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminLead>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminLead | null>> => {
    const res = await fetch(`/api/admin/leads/${id}`);
    return (await res.json()) as ApiResponse<AdminLead | null>;
  },
  create: async (payload: Partial<AdminLead>): Promise<ApiResponse<AdminLead>> => {
    const res = await fetch(`/api/admin/leads`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminLead>;
  },
  update: async (id: string, payload: Partial<AdminLead>): Promise<ApiResponse<AdminLead | null>> => {
    const res = await fetch(`/api/admin/leads/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminLead | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  updateStatus: async (id: string, status: LeadStatus): Promise<ApiResponse<AdminLead | null>> => {
    const res = await fetch(`/api/admin/leads/${id}/status`, { method: "POST", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminLead | null>;
  },
};

export const salesUsersApi = {
  list: async (role: string = "Sales"): Promise<ApiResponse<AdminSalesUser[]>> => {
    const res = await fetch(`/api/admin/users?role=${encodeURIComponent(role)}`);
    return (await res.json()) as ApiResponse<AdminSalesUser[]>;
  },
};

export const packagesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminPackage>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const destinationId = query.filter?.destinationId;
    if (typeof destinationId === "string") params.set("destinationId", destinationId);
    const res = await fetch(`/api/admin/campaigns?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminPackage>>;
  },
  all: async (): Promise<ApiResponse<AdminPackage[]>> => {
    const res = await fetch(`/api/admin/campaigns?page=1&pageSize=1000`);
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data.items };
  },
  get: async (id: string): Promise<ApiResponse<AdminPackage | null>> => {
    const res = await fetch(`/api/admin/campaigns/${id}`);
    return (await res.json()) as ApiResponse<AdminPackage | null>;
  },
  create: async (payload: Omit<AdminPackage, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminPackage>> => {
    const res = await fetch(`/api/admin/campaigns`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminPackage>;
  },
  update: async (id: string, payload: Partial<AdminPackage>): Promise<ApiResponse<AdminPackage | null>> => {
    const res = await fetch(`/api/admin/campaigns/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminPackage | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminPackage | null>> => {
    const res = await fetch(`/api/admin/campaigns/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminPackage | null>;
  },
  seed: (_rows: AdminPackage[]) => {
    // no-op for server-backed API
  },
};

export const itinerariesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminItinerary>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const packageId = query.filter?.packageId;
    if (typeof packageId === "string") params.set("packageId", packageId);
    const res = await fetch(`/api/admin/itineraries?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminItinerary>>;
  },
  all: async (): Promise<ApiResponse<AdminItinerary[]>> => {
    const res = await fetch(`/api/admin/itineraries?page=1&pageSize=1000`);
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data.items };
  },
  get: async (id: string): Promise<ApiResponse<AdminItinerary | null>> => {
    const res = await fetch(`/api/admin/itineraries/${id}`);
    return (await res.json()) as ApiResponse<AdminItinerary | null>;
  },
  create: async (payload: Omit<AdminItinerary, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminItinerary>> => {
    const res = await fetch(`/api/admin/itineraries`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminItinerary>;
  },
  update: async (id: string, payload: Partial<AdminItinerary>): Promise<ApiResponse<AdminItinerary | null>> => {
    const res = await fetch(`/api/admin/itineraries/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminItinerary | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/itineraries/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminItinerary | null>> => {
    const res = await fetch(`/api/admin/itineraries/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminItinerary | null>;
  },
};

export const hotelsApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminHotel>>> => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const packageId = query.filter?.packageId;
    if (typeof packageId === "string") params.set("packageId", packageId);
    const res = await fetch(`/api/admin/hotels?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminHotel>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminHotel | null>> => {
    const res = await fetch(`/api/admin/hotels/${id}`);
    return (await res.json()) as ApiResponse<AdminHotel | null>;
  },
  create: async (payload: Omit<AdminHotel, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminHotel>> => {
    const res = await fetch(`/api/admin/hotels`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminHotel>;
  },
  update: async (id: string, payload: Partial<AdminHotel>): Promise<ApiResponse<AdminHotel | null>> => {
    const res = await fetch(`/api/admin/hotels/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminHotel | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminHotel | null>> => {
    const res = await fetch(`/api/admin/hotels/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminHotel | null>;
  },
};

export const transfersApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminTransfer>>> => {
    const params = new URLSearchParams();
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const packageId = query.filter?.packageId;
    if (typeof packageId === "string") params.set("packageId", packageId);
    const res = await fetch(`/api/admin/transfers?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminTransfer>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminTransfer | null>> => {
    const res = await fetch(`/api/admin/transfers/${id}`);
    return (await res.json()) as ApiResponse<AdminTransfer | null>;
  },
  create: async (payload: Omit<AdminTransfer, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminTransfer>> => {
    const res = await fetch(`/api/admin/transfers`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransfer>;
  },
  update: async (id: string, payload: Partial<AdminTransfer>): Promise<ApiResponse<AdminTransfer | null>> => {
    const res = await fetch(`/api/admin/transfers/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransfer | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/transfers/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminTransfer | null>> => {
    const res = await fetch(`/api/admin/transfers/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminTransfer | null>;
  },
};

export const transferTypesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminTransferType>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const res = await fetch(`/api/admin/transfer-types?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminTransferType>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminTransferType | null>> => {
    const res = await fetch(`/api/admin/transfer-types/${id}`);
    return (await res.json()) as ApiResponse<AdminTransferType | null>;
  },
  create: async (payload: Omit<AdminTransferType, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminTransferType>> => {
    const res = await fetch(`/api/admin/transfer-types`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransferType>;
  },
  update: async (id: string, payload: Partial<AdminTransferType>): Promise<ApiResponse<AdminTransferType | null>> => {
    const res = await fetch(`/api/admin/transfer-types/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransferType | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await fetch(`/api/admin/transfer-types/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminTransferType | null>> => {
    const res = await fetch(`/api/admin/transfer-types/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminTransferType | null>;
  },
};

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
