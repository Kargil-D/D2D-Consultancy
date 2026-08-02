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
  AdminBooking,
  AdminBookingActivity,
  AdminBookingFlight,
  AdminBookingHotel,
  AdminBookingInsurance,
  AdminBookingTransfer,
  AdminBookingVisa,
  AdminCurrency,
  AdminCurrencyRateHistory,
  AdminDestination,
  AdminEmployee,
  AdminEmployeeAuditLog,
  AdminEmployeeManagerOption,
  AdminEnquiryConfig,
  AdminHeroConfig,
  AdminHotel,
  AdminHotelMaster,
  AdminItinerary,
  AdminLead,
  AdminLeadBoard,
  AdminPackage,
  AdminQuotation,
  AdminReview,
  AdminRole,
  AdminRolePickerOption,
  AdminRosterGrid,
  AdminMyRoster,
  RosterStatus,
  AdminSalesUser,
  AdminTransfer,
  AdminTransferType,
  ApiResponse,
  LeadStatus,
  Paginated,
  QuotationCustomerInput,
} from "@/types/admin";

const KEY = (entity: string) => `d2d.admin.${entity}`;

const isBrowser = () => typeof window !== "undefined";

let refreshInFlight: Promise<boolean> | null = null;

/** Drop-in replacement for fetch() used by every admin API call. The access token cookie
 * expires after 15 minutes (see src/lib/jwt.ts) — a user idling on a form past that gets a
 * hard 401 on save with no recovery otherwise. On a 401, silently hits /api/auth/refresh
 * once and retries the original request, so long-lived admin sessions don't lose work.
 * Concurrent 401s share a single in-flight refresh instead of each firing their own. */
async function adminFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  const refreshed = await refreshInFlight;
  if (!refreshed) return res;

  return fetch(input, init);
}

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
    const res = await adminFetch(`/api/admin/destinations?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminDestination>>;
  },
  all: async (): Promise<ApiResponse<AdminDestination[]>> => {
    const res = await adminFetch(`/api/admin/destinations?page=1&pageSize=1000`);
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data.items };
  },
  get: async (id: string): Promise<ApiResponse<AdminDestination | null>> => {
    const res = await adminFetch(`/api/admin/destinations/${id}`);
    return (await res.json()) as ApiResponse<AdminDestination | null>;
  },
  create: async (payload: Omit<AdminDestination, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminDestination>> => {
    const res = await adminFetch(`/api/admin/destinations`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminDestination>;
  },
  update: async (id: string, payload: Partial<AdminDestination>): Promise<ApiResponse<AdminDestination | null>> => {
    const res = await adminFetch(`/api/admin/destinations/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminDestination | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/destinations/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminDestination | null>> => {
    const res = await adminFetch(`/api/admin/destinations/${id}/toggle-status`, { method: "POST" });
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
    const res = await adminFetch(`/api/admin/leads?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminLead>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminLead | null>> => {
    const res = await adminFetch(`/api/admin/leads/${id}`);
    return (await res.json()) as ApiResponse<AdminLead | null>;
  },
  create: async (payload: Partial<AdminLead>): Promise<ApiResponse<AdminLead>> => {
    const res = await adminFetch(`/api/admin/leads`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminLead>;
  },
  update: async (id: string, payload: Partial<AdminLead>): Promise<ApiResponse<AdminLead | null>> => {
    const res = await adminFetch(`/api/admin/leads/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminLead | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  updateStatus: async (id: string, status: LeadStatus): Promise<ApiResponse<AdminLead | null>> => {
    const res = await adminFetch(`/api/admin/leads/${id}/status`, { method: "POST", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminLead | null>;
  },
};

export const salesUsersApi = {
  list: async (role: string = "Sales"): Promise<ApiResponse<AdminSalesUser[]>> => {
    const res = await adminFetch(`/api/admin/users?role=${encodeURIComponent(role)}`);
    return (await res.json()) as ApiResponse<AdminSalesUser[]>;
  },
};

export const quotationsApi = {
  list: async (
    query: { search?: string; leadId?: string; status?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResponse<Paginated<AdminQuotation>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.leadId) params.set("leadId", query.leadId);
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const res = await adminFetch(`/api/admin/quotations?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminQuotation>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminQuotation | null>> => {
    const res = await adminFetch(`/api/admin/quotations/${id}`);
    return (await res.json()) as ApiResponse<AdminQuotation | null>;
  },
  create: async (
    payload: Partial<AdminQuotation> & { customer: QuotationCustomerInput },
  ): Promise<ApiResponse<AdminQuotation>> => {
    const res = await adminFetch(`/api/admin/quotations`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminQuotation>;
  },
  update: async (
    id: string,
    payload: Partial<AdminQuotation> & { customer?: QuotationCustomerInput },
  ): Promise<ApiResponse<AdminQuotation | null>> => {
    const res = await adminFetch(`/api/admin/quotations/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminQuotation | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/quotations/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  duplicate: async (id: string): Promise<ApiResponse<AdminQuotation>> => {
    const res = await adminFetch(`/api/admin/quotations/${id}/duplicate`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminQuotation>;
  },
  generateShareLink: async (id: string): Promise<ApiResponse<{ token: string; url: string }>> => {
    const res = await adminFetch(`/api/admin/quotations/${id}/share`, { method: "POST" });
    return (await res.json()) as ApiResponse<{ token: string; url: string }>;
  },
  sendEmail: async (id: string): Promise<ApiResponse<AdminQuotation | null>> => {
    const res = await adminFetch(`/api/admin/quotations/${id}/send-email`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminQuotation | null>;
  },
};

export const bookingsApi = {
  list: async (
    query: { search?: string; leadId?: string; status?: string; page?: number; pageSize?: number } = {},
  ): Promise<ApiResponse<Paginated<AdminBooking>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.leadId) params.set("leadId", query.leadId);
    if (query.status) params.set("status", query.status);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const res = await adminFetch(`/api/admin/bookings?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminBooking>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}`);
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  create: async (payload: Partial<AdminBooking>): Promise<ApiResponse<AdminBooking>> => {
    const res = await adminFetch(`/api/admin/bookings`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking>;
  },
  update: async (id: string, payload: Partial<AdminBooking>): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  updateStatus: async (id: string, status: string): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/status`, { method: "POST", body: JSON.stringify({ status }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  updateDmc: async (
    id: string,
    payload: { dmcName?: string | null; dmcEmailSentDate?: string | null; dmcResponse?: string | null; dmcRemarks?: string | null },
  ): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/dmc`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  uploadDocument: async (id: string, type: string, url: string, description?: string): Promise<ApiResponse<unknown>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/documents`, { method: "POST", body: JSON.stringify({ type, url, description }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<unknown>;
  },
  removeDocument: async (id: string, docId: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/documents/${docId}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  saveFlights: async (id: string, rows: AdminBookingFlight[]): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/flights`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  saveHotels: async (id: string, rows: AdminBookingHotel[]): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/hotels`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  saveActivities: async (id: string, rows: AdminBookingActivity[]): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/activities`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  saveTransfers: async (id: string, rows: AdminBookingTransfer[]): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/transfers`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  saveVisas: async (id: string, rows: AdminBookingVisa[]): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/visas`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  saveInsurances: async (id: string, rows: AdminBookingInsurance[]): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/insurances`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  saveCostSheet: async (
    id: string,
    rows: { id: string; supplierName?: string; bookingCost?: number; settlementCost?: number; sellingPrice?: number; status?: string; remarks?: string | null }[],
  ): Promise<ApiResponse<AdminBooking | null>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/cost-sheet`, { method: "PUT", body: JSON.stringify({ rows }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminBooking | null>;
  },
  addCustomerPayment: async (
    id: string,
    payload: { paymentDate: string; paymentMode: string; amount: number; transactionReference?: string | null; remarks?: string | null },
  ): Promise<ApiResponse<unknown>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/payments/customer`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<unknown>;
  },
  addSupplierPayment: async (
    id: string,
    payload: { supplierName: string; paymentDate: string; amount: number; paymentMode: string; transactionReference?: string | null; settlementStatus: string },
  ): Promise<ApiResponse<unknown>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/payments/supplier`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<unknown>;
  },
  addNote: async (id: string, authorName: string, message: string): Promise<ApiResponse<unknown>> => {
    const res = await adminFetch(`/api/admin/bookings/${id}/notes`, { method: "POST", body: JSON.stringify({ authorName, message }), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<unknown>;
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
    const res = await adminFetch(`/api/admin/campaigns?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminPackage>>;
  },
  all: async (): Promise<ApiResponse<AdminPackage[]>> => {
    const res = await adminFetch(`/api/admin/campaigns?page=1&pageSize=1000`);
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data.items };
  },
  get: async (id: string): Promise<ApiResponse<AdminPackage | null>> => {
    const res = await adminFetch(`/api/admin/campaigns/${id}`);
    return (await res.json()) as ApiResponse<AdminPackage | null>;
  },
  create: async (payload: Omit<AdminPackage, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminPackage>> => {
    const res = await adminFetch(`/api/admin/campaigns`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminPackage>;
  },
  update: async (id: string, payload: Partial<AdminPackage>): Promise<ApiResponse<AdminPackage | null>> => {
    const res = await adminFetch(`/api/admin/campaigns/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminPackage | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminPackage | null>> => {
    const res = await adminFetch(`/api/admin/campaigns/${id}/toggle-status`, { method: "POST" });
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
    const res = await adminFetch(`/api/admin/itineraries?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminItinerary>>;
  },
  all: async (): Promise<ApiResponse<AdminItinerary[]>> => {
    const res = await adminFetch(`/api/admin/itineraries?page=1&pageSize=1000`);
    const json = await res.json();
    return { success: json.success, message: json.message, data: json.data.items };
  },
  get: async (id: string): Promise<ApiResponse<AdminItinerary | null>> => {
    const res = await adminFetch(`/api/admin/itineraries/${id}`);
    return (await res.json()) as ApiResponse<AdminItinerary | null>;
  },
  create: async (payload: Omit<AdminItinerary, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminItinerary>> => {
    const res = await adminFetch(`/api/admin/itineraries`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminItinerary>;
  },
  update: async (id: string, payload: Partial<AdminItinerary>): Promise<ApiResponse<AdminItinerary | null>> => {
    const res = await adminFetch(`/api/admin/itineraries/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminItinerary | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/itineraries/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminItinerary | null>> => {
    const res = await adminFetch(`/api/admin/itineraries/${id}/toggle-status`, { method: "POST" });
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
    const res = await adminFetch(`/api/admin/hotels?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminHotel>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminHotel | null>> => {
    const res = await adminFetch(`/api/admin/hotels/${id}`);
    return (await res.json()) as ApiResponse<AdminHotel | null>;
  },
  create: async (payload: Omit<AdminHotel, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminHotel>> => {
    const res = await adminFetch(`/api/admin/hotels`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminHotel>;
  },
  update: async (id: string, payload: Partial<AdminHotel>): Promise<ApiResponse<AdminHotel | null>> => {
    const res = await adminFetch(`/api/admin/hotels/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminHotel | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminHotel | null>> => {
    const res = await adminFetch(`/api/admin/hotels/${id}/toggle-status`, { method: "POST" });
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
    const res = await adminFetch(`/api/admin/transfers?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminTransfer>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminTransfer | null>> => {
    const res = await adminFetch(`/api/admin/transfers/${id}`);
    return (await res.json()) as ApiResponse<AdminTransfer | null>;
  },
  create: async (payload: Omit<AdminTransfer, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminTransfer>> => {
    const res = await adminFetch(`/api/admin/transfers`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransfer>;
  },
  update: async (id: string, payload: Partial<AdminTransfer>): Promise<ApiResponse<AdminTransfer | null>> => {
    const res = await adminFetch(`/api/admin/transfers/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransfer | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/transfers/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminTransfer | null>> => {
    const res = await adminFetch(`/api/admin/transfers/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminTransfer | null>;
  },
};

export const transferTypesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminTransferType>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const res = await adminFetch(`/api/admin/transfer-types?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminTransferType>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminTransferType | null>> => {
    const res = await adminFetch(`/api/admin/transfer-types/${id}`);
    return (await res.json()) as ApiResponse<AdminTransferType | null>;
  },
  create: async (payload: Omit<AdminTransferType, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminTransferType>> => {
    const res = await adminFetch(`/api/admin/transfer-types`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransferType>;
  },
  update: async (id: string, payload: Partial<AdminTransferType>): Promise<ApiResponse<AdminTransferType | null>> => {
    const res = await adminFetch(`/api/admin/transfer-types/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminTransferType | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/transfer-types/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminTransferType | null>> => {
    const res = await adminFetch(`/api/admin/transfer-types/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminTransferType | null>;
  },
};

export const currenciesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminCurrency>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const { status } = query.filter ?? {};
    if (typeof status === "string") params.set("status", status);
    const res = await adminFetch(`/api/admin/currencies?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminCurrency>>;
  },
  get: async (id: string): Promise<ApiResponse<AdminCurrency | null>> => {
    const res = await adminFetch(`/api/admin/currencies/${id}`);
    return (await res.json()) as ApiResponse<AdminCurrency | null>;
  },
  create: async (payload: Omit<AdminCurrency, "id" | "createdDate" | "updatedDate">): Promise<ApiResponse<AdminCurrency>> => {
    const res = await adminFetch(`/api/admin/currencies`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminCurrency>;
  },
  update: async (id: string, payload: Partial<AdminCurrency>): Promise<ApiResponse<AdminCurrency | null>> => {
    const res = await adminFetch(`/api/admin/currencies/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminCurrency | null>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminCurrency | null>> => {
    const res = await adminFetch(`/api/admin/currencies/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminCurrency | null>;
  },
  history: async (id: string): Promise<ApiResponse<AdminCurrencyRateHistory[]>> => {
    const res = await adminFetch(`/api/admin/currencies/${id}/history`);
    return (await res.json()) as ApiResponse<AdminCurrencyRateHistory[]>;
  },
};

export const hotelMasterApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminHotelMaster>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const { status } = query.filter ?? {};
    if (typeof status === "string") params.set("status", status);
    const res = await adminFetch(`/api/admin/hotel-master?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminHotelMaster>>;
  },
  /** Unpaginated, Active-only list — used by the Quotation Hotel step's search/select. */
  all: async (): Promise<ApiResponse<AdminHotelMaster[]>> => {
    const res = await adminFetch(`/api/admin/hotel-master?all=true`);
    return (await res.json()) as ApiResponse<AdminHotelMaster[]>;
  },
  get: async (id: string): Promise<ApiResponse<AdminHotelMaster | null>> => {
    const res = await adminFetch(`/api/admin/hotel-master/${id}`);
    return (await res.json()) as ApiResponse<AdminHotelMaster | null>;
  },
  create: async (payload: Partial<AdminHotelMaster>): Promise<ApiResponse<AdminHotelMaster>> => {
    const res = await adminFetch(`/api/admin/hotel-master`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminHotelMaster>;
  },
  update: async (id: string, payload: Partial<AdminHotelMaster>): Promise<ApiResponse<AdminHotelMaster | null>> => {
    const res = await adminFetch(`/api/admin/hotel-master/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminHotelMaster | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/hotel-master/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminHotelMaster | null>> => {
    const res = await adminFetch(`/api/admin/hotel-master/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminHotelMaster | null>;
  },
};

export const employeesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminEmployee>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const { status, department } = query.filter ?? {};
    if (typeof status === "string") params.set("status", status);
    if (typeof department === "string") params.set("department", department);
    const res = await adminFetch(`/api/admin/employees?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminEmployee>>;
  },
  /** Unpaginated, Active-only list — used by the Reporting Manager picker. */
  picker: async (excludeId?: string): Promise<ApiResponse<AdminEmployeeManagerOption[]>> => {
    const params = new URLSearchParams({ picker: "true" });
    if (excludeId) params.set("excludeId", excludeId);
    const res = await adminFetch(`/api/admin/employees?${params.toString()}`);
    return (await res.json()) as ApiResponse<AdminEmployeeManagerOption[]>;
  },
  get: async (id: string): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/${id}`);
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
  /** Resolves the Employee record linked to whoever is currently logged in — powers "Profile Settings". */
  me: async (): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/me`);
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
  create: async (payload: Partial<AdminEmployee>): Promise<ApiResponse<AdminEmployee>> => {
    const res = await adminFetch(`/api/admin/employees`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminEmployee>;
  },
  update: async (id: string, payload: Partial<AdminEmployee>): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/employees/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
  /** Decrypts one sensitive field (Aadhaar/bank account number) for display — Admin-only server-side, logged to the audit trail every call. */
  reveal: async (id: string, field: "aadhaarNumber" | "accountNumber"): Promise<ApiResponse<{ value: string }>> => {
    const res = await adminFetch(`/api/admin/employees/${id}/reveal?field=${field}`);
    return (await res.json()) as ApiResponse<{ value: string }>;
  },
  auditLog: async (id: string): Promise<ApiResponse<AdminEmployeeAuditLog[]>> => {
    const res = await adminFetch(`/api/admin/employees/${id}/audit-log`);
    return (await res.json()) as ApiResponse<AdminEmployeeAuditLog[]>;
  },
  /** Links this employee's HR record to an existing login User by email — does not create new accounts. */
  linkAccount: async (id: string, email: string): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/${id}/link-account`, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
  unlinkAccount: async (id: string): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/${id}/link-account`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
  /** Sets the Role on the employee's linked login User — real, enforced access, requires linkAccount first. */
  assignRole: async (id: string, roleId: string): Promise<ApiResponse<AdminEmployee | null>> => {
    const res = await adminFetch(`/api/admin/employees/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ roleId }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<AdminEmployee | null>;
  },
};

export const rolesApi = {
  list: async (query: ListQuery = {}): Promise<ApiResponse<Paginated<AdminRole>>> => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", String(query.search));
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    const { status } = query.filter ?? {};
    if (typeof status === "string") params.set("status", status);
    const res = await adminFetch(`/api/admin/roles?${params.toString()}`);
    return (await res.json()) as ApiResponse<Paginated<AdminRole>>;
  },
  /** Unpaginated, Active-only — used by the Employee screen's "Assign Role" picker. */
  picker: async (): Promise<ApiResponse<AdminRolePickerOption[]>> => {
    const res = await adminFetch(`/api/admin/roles?picker=true`);
    return (await res.json()) as ApiResponse<AdminRolePickerOption[]>;
  },
  get: async (id: string): Promise<ApiResponse<AdminRole | null>> => {
    const res = await adminFetch(`/api/admin/roles/${id}`);
    return (await res.json()) as ApiResponse<AdminRole | null>;
  },
  create: async (payload: Partial<AdminRole>): Promise<ApiResponse<AdminRole>> => {
    const res = await adminFetch(`/api/admin/roles`, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminRole>;
  },
  update: async (id: string, payload: Partial<AdminRole>): Promise<ApiResponse<AdminRole | null>> => {
    const res = await adminFetch(`/api/admin/roles/${id}`, { method: "PUT", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
    return (await res.json()) as ApiResponse<AdminRole | null>;
  },
  remove: async (id: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/roles/${id}`, { method: "DELETE" });
    return (await res.json()) as ApiResponse<boolean>;
  },
  toggleStatus: async (id: string): Promise<ApiResponse<AdminRole | null>> => {
    const res = await adminFetch(`/api/admin/roles/${id}/toggle-status`, { method: "POST" });
    return (await res.json()) as ApiResponse<AdminRole | null>;
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

export const rosterApi = {
  grid: async (params: { year: number; month: number; department?: string; search?: string }): Promise<ApiResponse<AdminRosterGrid>> => {
    const q = new URLSearchParams({ year: String(params.year), month: String(params.month) });
    if (params.department) q.set("department", params.department);
    if (params.search) q.set("search", params.search);
    const res = await adminFetch(`/api/admin/roster?${q.toString()}`);
    return (await res.json()) as ApiResponse<AdminRosterGrid>;
  },
  /** status: null clears the day back to unmarked. */
  mark: async (employeeId: string, date: string, status: RosterStatus | null): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/roster`, {
      method: "PUT",
      body: JSON.stringify({ employeeId, date, status }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<boolean>;
  },
  bulkMark: async (employeeIds: string[], date: string, status: RosterStatus): Promise<ApiResponse<{ updated: number }>> => {
    const res = await adminFetch(`/api/admin/roster/bulk`, {
      method: "POST",
      body: JSON.stringify({ employeeIds, date, status }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<{ updated: number }>;
  },
  /** Self-view — always your own roster, never a picker. */
  mine: async (year: number, month: number): Promise<ApiResponse<AdminMyRoster>> => {
    const res = await adminFetch(`/api/roster/me?year=${year}&month=${month}`);
    return (await res.json()) as ApiResponse<AdminMyRoster>;
  },
  /** Self-mark — always your own roster, never a picker. status: null clears the day back to unmarked. */
  markMine: async (date: string, status: RosterStatus | null): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/roster/me`, {
      method: "PUT",
      body: JSON.stringify({ date, status }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<boolean>;
  },
};

export const leadAssignmentApi = {
  board: async (date?: string): Promise<ApiResponse<AdminLeadBoard>> => {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    const res = await adminFetch(`/api/admin/lead-assignment${q}`);
    return (await res.json()) as ApiResponse<AdminLeadBoard>;
  },
  assign: async (leadId: string, toUserId: string): Promise<ApiResponse<boolean>> => {
    const res = await adminFetch(`/api/admin/lead-assignment/assign`, {
      method: "POST",
      body: JSON.stringify({ leadId, toUserId }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<boolean>;
  },
  bulkAssign: async (leadIds: string[], toUserId: string): Promise<ApiResponse<{ updated: number }>> => {
    const res = await adminFetch(`/api/admin/lead-assignment/bulk-assign`, {
      method: "POST",
      body: JSON.stringify({ leadIds, toUserId }),
      headers: { "Content-Type": "application/json" },
    });
    return (await res.json()) as ApiResponse<{ updated: number }>;
  },
};

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
