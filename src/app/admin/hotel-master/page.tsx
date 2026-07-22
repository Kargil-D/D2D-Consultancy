"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Edit, Power, Image as ImageIcon, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DataTable, { type Column } from "@/components/admin/ui/DataTable";
import Pagination from "@/components/admin/ui/Pagination";
import Drawer from "@/components/admin/ui/Drawer";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import TagInput from "@/components/admin/ui/TagInput";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { useToast } from "@/components/admin/ui/Toast";
import { destinationsApi, hotelMasterApi } from "@/lib/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import type { AdminDestination, AdminHotelMaster } from "@/types/admin";

const PAGE_SIZE = 10;

const emptyForm = (): Partial<AdminHotelMaster> => ({
  name: "",
  destinationId: "",
  images: [],
  description: "",
  category: "",
  roomTypes: [],
  mealPlans: [],
  amenities: [],
  googleMapUrl: "",
  website: "",
  status: "Active",
});

export default function HotelMasterPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { notify } = useToast();

  const isAdmin = !!user?.roles.includes("admin");

  const [rows, setRows] = useState<AdminHotelMaster[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [destinations, setDestinations] = useState<AdminDestination[]>([]);
  const [drawer, setDrawer] = useState<{ open: boolean; form: Partial<AdminHotelMaster> }>({
    open: false,
    form: emptyForm(),
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.replace(`/login?redirect=${encodeURIComponent("/admin/hotel-master")}`);
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    destinationsApi.all().then((res) => {
      if (res.success) setDestinations(res.data);
    });
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await hotelMasterApi.list({ search, page, pageSize: PAGE_SIZE });
    setLoading(false);
    if (res.success) {
      setRows(res.data.items);
      setTotal(res.data.total);
    }
  }, [search, page]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) reload();
  }, [reload, isAuthenticated, isAdmin]);

  const openCreate = () => setDrawer({ open: true, form: emptyForm() });
  const openEdit = (row: AdminHotelMaster) => setDrawer({ open: true, form: { ...row } });

  const setForm = (patch: Partial<AdminHotelMaster>) =>
    setDrawer((d) => ({ ...d, form: { ...d.form, ...patch } }));

  const addImage = (url: string) => {
    if (!url) return;
    setForm({ images: [...(drawer.form.images ?? []), url] });
  };
  const removeImage = (idx: number) => {
    setForm({ images: (drawer.form.images ?? []).filter((_, i) => i !== idx) });
  };

  const save = async () => {
    const f = drawer.form;
    if (!f.name?.trim()) return notify("Hotel name is required", "error");

    const res = f.id ? await hotelMasterApi.update(f.id, f) : await hotelMasterApi.create(f);
    if (!res.success) return notify(res.message || "Unable to save hotel", "error");
    notify(f.id ? "Hotel updated" : "Hotel added", "success");
    setDrawer({ open: false, form: emptyForm() });
    reload();
  };

  const toggleStatus = async (row: AdminHotelMaster) => {
    const res = await hotelMasterApi.toggleStatus(row.id);
    if (!res.success) return notify(res.message || "Unable to update status", "error");
    notify(`${row.name} is now ${res.data?.status}`, "success");
    reload();
  };

  const columns: Column<AdminHotelMaster>[] = [
    {
      key: "name",
      label: "Hotel",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {r.images?.[0] ? (
              <Image src={r.images[0]} alt={r.name} fill sizes="40px" className="object-cover" unoptimized />
            ) : (
              <ImageIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{r.name}</div>
            <div className="text-xs text-slate-500">{r.category || "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "destination", label: "Destination", render: (r) => r.destination?.name ?? "—" },
    { key: "roomTypes", label: "Room Types", render: (r) => (r.roomTypes.length ? r.roomTypes.join(", ") : "—") },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => toggleStatus(r)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label={r.status === "Active" ? "Deactivate hotel" : "Activate hotel"}
            title={r.status === "Active" ? "Deactivate" : "Activate"}
          >
            <Power className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit hotel" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <AdminShell title="Hotel Master">
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">Loading…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Hotel Master">
      <Breadcrumb items={[{ label: "Sales", href: "/admin/sales" }, { label: "Hotel Master" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotel Master</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Searchable hotel catalog — sales picks from here when building a quotation&apos;s Hotel step.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Hotel
        </button>
      </div>

      <DataTable<AdminHotelMaster>
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(r) => r.id}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        searchPlaceholder="Search by hotel name…"
      />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <Drawer
        open={drawer.open}
        title={drawer.form.id ? "Edit Hotel" : "Add Hotel"}
        width="xl"
        onClose={() => setDrawer({ open: false, form: emptyForm() })}
        footer={
          <>
            <button onClick={() => setDrawer({ open: false, form: emptyForm() })} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
              Cancel
            </button>
            <button onClick={save} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {drawer.form.id ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hotel Name" required>
              <input className={inputCls} value={drawer.form.name ?? ""} onChange={(e) => setForm({ name: e.target.value })} />
            </Field>
            <Field label="Destination">
              <select className={selectCls} value={drawer.form.destinationId ?? ""} onChange={(e) => setForm({ destinationId: e.target.value })}>
                <option value="">Select destination</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Category" hint="e.g. 3-Star, 5-Star, Luxury">
              <input className={inputCls} value={drawer.form.category ?? ""} onChange={(e) => setForm({ category: e.target.value })} />
            </Field>
            <Field label="Website">
              <input className={inputCls} value={drawer.form.website ?? ""} onChange={(e) => setForm({ website: e.target.value })} placeholder="https://" />
            </Field>
          </div>
          <Field label="Google Map URL">
            <input className={inputCls} value={drawer.form.googleMapUrl ?? ""} onChange={(e) => setForm({ googleMapUrl: e.target.value })} placeholder="https://maps.google.com/…" />
          </Field>
          <Field label="Description">
            <textarea className={textareaCls} value={drawer.form.description ?? ""} onChange={(e) => setForm({ description: e.target.value })} />
          </Field>
          <Field label="Hotel Images">
            <div className="grid grid-cols-4 gap-2">
              {(drawer.form.images ?? []).map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <Image src={url} alt={`hotel-${i}`} fill sizes="120px" className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="aspect-square">
                <ImageUpload value="" onChange={addImage} label="Add" aspect="square" />
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Room Types">
              <TagInput value={drawer.form.roomTypes ?? []} onChange={(v) => setForm({ roomTypes: v })} placeholder="Deluxe Room" />
            </Field>
            <Field label="Meal Plans">
              <TagInput value={drawer.form.mealPlans ?? []} onChange={(v) => setForm({ mealPlans: v })} placeholder="Breakfast Included" />
            </Field>
            <Field label="Amenities">
              <TagInput value={drawer.form.amenities ?? []} onChange={(v) => setForm({ amenities: v })} placeholder="Pool, WiFi" />
            </Field>
          </div>
          <Field label="Status">
            <StatusToggle value={drawer.form.status ?? "Active"} onChange={(status) => setForm({ status })} />
          </Field>
        </div>
      </Drawer>
    </AdminShell>
  );
}
