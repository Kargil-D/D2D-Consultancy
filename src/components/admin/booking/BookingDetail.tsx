"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Edit, FileDown, Mail, Copy, Link as LinkIcon, ExternalLink, Save, Download,
  LayoutDashboard, Wallet, Plane, BedDouble, Ticket, ArrowRightLeft, Stamp, ShieldCheck,
  CreditCard, FolderOpen, MessageCircle, History,
} from "lucide-react";
import { Field, inputCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import BookingStatusStepper from "@/components/admin/booking/BookingStatusStepper";
import BookingFlightsEditor from "@/components/admin/booking/BookingFlightsEditor";
import BookingHotelsEditor from "@/components/admin/booking/BookingHotelsEditor";
import BookingActivitiesEditor from "@/components/admin/booking/BookingActivitiesEditor";
import BookingTransfersEditor from "@/components/admin/booking/BookingTransfersEditor";
import BookingVisasEditor from "@/components/admin/booking/BookingVisasEditor";
import BookingInsurancesEditor from "@/components/admin/booking/BookingInsurancesEditor";
import BookingCostSheet from "@/components/admin/booking/BookingCostSheet";
import BookingPayments from "@/components/admin/booking/BookingPayments";
import BookingDocumentsTab from "@/components/admin/booking/BookingDocumentsTab";
import BookingChatTab from "@/components/admin/booking/BookingChatTab";
import BookingTimelineTab from "@/components/admin/booking/BookingTimelineTab";
import { bookingsApi } from "@/lib/adminApi";
import type {
  AdminBooking, AdminBookingActivity, AdminBookingFlight, AdminBookingHotel, AdminBookingInsurance,
  AdminBookingTransfer, AdminBookingVisa, BookingDocumentType, BookingStatus, CostSheetStatus, PaymentMode, SettlementStatus,
} from "@/types/admin";

interface BookingDetailProps {
  id: string;
}

const bookingCode = (seq: number) => `BK-${seq.toString().padStart(4, "0")}`;
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "costsheet", label: "Cost Sheet", icon: Wallet },
  { key: "flights", label: "Flights", icon: Plane },
  { key: "hotels", label: "Hotels", icon: BedDouble },
  { key: "activities", label: "Activities", icon: Ticket },
  { key: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { key: "visa", label: "Visa", icon: Stamp },
  { key: "insurance", label: "Insurance", icon: ShieldCheck },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "chat", label: "Customer Chat", icon: MessageCircle },
  { key: "timeline", label: "Timeline", icon: History },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BookingDetail({ id }: BookingDetailProps) {
  const { notify } = useToast();
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");

  const [dmcName, setDmcName] = useState("");
  const [dmcEmailSentDate, setDmcEmailSentDate] = useState("");
  const [dmcResponse, setDmcResponse] = useState("");
  const [dmcRemarks, setDmcRemarks] = useState("");
  const [savingDmc, setSavingDmc] = useState(false);

  // Local drafts for each service list — the editors below only touch these on every
  // keystroke; each tab has its own explicit Save button that pushes to the server,
  // same pattern as the original single "Save Components" table.
  const [flights, setFlights] = useState<AdminBookingFlight[]>([]);
  const [hotels, setHotels] = useState<AdminBookingHotel[]>([]);
  const [activities, setActivities] = useState<AdminBookingActivity[]>([]);
  const [transfers, setTransfers] = useState<AdminBookingTransfer[]>([]);
  const [visas, setVisas] = useState<AdminBookingVisa[]>([]);
  const [insurances, setInsurances] = useState<AdminBookingInsurance[]>([]);
  const [savingFlights, setSavingFlights] = useState(false);
  const [savingHotels, setSavingHotels] = useState(false);
  const [savingActivities, setSavingActivities] = useState(false);
  const [savingTransfers, setSavingTransfers] = useState(false);
  const [savingVisas, setSavingVisas] = useState(false);
  const [savingInsurances, setSavingInsurances] = useState(false);

  const reload = useCallback(async () => {
    const res = await bookingsApi.get(id);
    if (res.success && res.data) {
      const b = res.data;
      setBooking(b);
      setDmcName(b.dmcName ?? "");
      setDmcEmailSentDate(b.dmcEmailSentDate ? b.dmcEmailSentDate.slice(0, 10) : "");
      setDmcResponse(b.dmcResponse ?? "");
      setDmcRemarks(b.dmcRemarks ?? "");
      setFlights(b.flights);
      setHotels(b.hotels.map((h) => ({ ...h, checkIn: h.checkIn?.slice(0, 10) ?? null, checkOut: h.checkOut?.slice(0, 10) ?? null })));
      setActivities(b.activities.map((a) => ({ ...a, activityDate: a.activityDate?.slice(0, 10) ?? null })));
      setTransfers(b.transfers);
      setVisas(b.visas.map((v) => ({
        ...v,
        applicationDate: v.applicationDate?.slice(0, 10) ?? null,
        issueDate: v.issueDate?.slice(0, 10) ?? null,
        expiryDate: v.expiryDate?.slice(0, 10) ?? null,
      })));
      setInsurances(b.insurances.map((ins) => ({
        ...ins,
        travelStartDate: ins.travelStartDate?.slice(0, 10) ?? null,
        travelEndDate: ins.travelEndDate?.slice(0, 10) ?? null,
      })));
    } else {
      notify(res.message || "Unable to load booking", "error");
    }
    setLoading(false);
  }, [id, notify]);

  useEffect(() => {
    reload();
  }, [reload]);

  const changeStatus = async (status: BookingStatus) => {
    if (!booking || status === booking.status) return;
    setUpdatingStatus(true);
    try {
      const res = await bookingsApi.updateStatus(id, status);
      if (!res.success) return notify(res.message || "Unable to update status", "error");
      notify(`Status updated to ${status}`, "success");
      reload();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveDmc = async () => {
    setSavingDmc(true);
    try {
      const res = await bookingsApi.updateDmc(id, { dmcName, dmcEmailSentDate: dmcEmailSentDate || null, dmcResponse, dmcRemarks });
      if (!res.success) return notify(res.message || "Unable to save DMC details", "error");
      notify("DMC communication saved", "success");
    } finally {
      setSavingDmc(false);
    }
  };

  const saveFlights = async () => {
    setSavingFlights(true);
    try {
      const res = await bookingsApi.saveFlights(id, flights);
      if (!res.success) return notify(res.message || "Unable to save flights", "error");
      notify("Flights saved", "success");
      reload();
    } finally {
      setSavingFlights(false);
    }
  };
  const saveHotels = async () => {
    setSavingHotels(true);
    try {
      const res = await bookingsApi.saveHotels(id, hotels);
      if (!res.success) return notify(res.message || "Unable to save hotels", "error");
      notify("Hotels saved", "success");
      reload();
    } finally {
      setSavingHotels(false);
    }
  };
  const saveActivities = async () => {
    setSavingActivities(true);
    try {
      const res = await bookingsApi.saveActivities(id, activities);
      if (!res.success) return notify(res.message || "Unable to save activities", "error");
      notify("Activities saved", "success");
      reload();
    } finally {
      setSavingActivities(false);
    }
  };
  const saveTransfers = async () => {
    setSavingTransfers(true);
    try {
      const res = await bookingsApi.saveTransfers(id, transfers);
      if (!res.success) return notify(res.message || "Unable to save transfers", "error");
      notify("Transfers saved", "success");
      reload();
    } finally {
      setSavingTransfers(false);
    }
  };
  const draftId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Pulls the corresponding service list from the linked Quotation (Steps 3/5/4 of the
  // Quotation wizard) and appends it to the current draft — additive, not a replace, so
  // it never clobbers anything already entered here.
  const loadHotelsFromQuotation = () => {
    if (!booking?.quotation) return;
    const rows: AdminBookingHotel[] = booking.quotation.hotelOptions.flatMap((g) =>
      g.hotels.map((h) => ({
        id: draftId(),
        hotelName: h.hotelName,
        hotelCategory: h.category ?? "",
        checkIn: h.checkIn || null,
        checkOut: h.checkOut || null,
        nights: h.nights,
        rooms: h.rooms,
        roomCategory: "",
        roomType: h.roomType,
        mealPlan: h.mealPlan,
        occupancy: "",
        amenities: h.amenities,
        hotelAddress: "",
        googleMapLink: h.googleMapUrl ?? null,
        hotelContactNumber: "",
        supplier: "",
        voucherUrl: null,
      })),
    );
    setHotels((prev) => [...prev, ...rows]);
    notify(`${rows.length} hotel(s) loaded from quotation`, "success");
  };

  const loadActivitiesFromQuotation = () => {
    if (!booking?.quotation) return;
    const rows: AdminBookingActivity[] = booking.quotation.activities.map((a) => ({
      id: draftId(),
      activityName: a.name,
      activityDate: null,
      activityTime: a.activityTime,
      duration: a.duration,
      tourType: "Private",
      pickupIncluded: false,
      pickupTime: a.reportingTime,
      pickupLocation: "",
      meetingPoint: "",
      dropLocation: "",
      inclusions: [a.description, a.notes].filter(Boolean).join("\n"),
      exclusions: "",
      supplier: "",
      voucherUrl: null,
    }));
    setActivities((prev) => [...prev, ...rows]);
    notify(`${rows.length} activity(ies) loaded from quotation`, "success");
  };

  const loadTransfersFromQuotation = () => {
    if (!booking?.quotation) return;
    const rows: AdminBookingTransfer[] = booking.quotation.transfers.map((t) => ({
      id: draftId(),
      transferType: t.name,
      vehicleType: t.vehicleType,
      mode: t.mode,
      pickupAt: null,
      pickupLocation: t.pickupLocation,
      dropLocation: t.dropLocation,
      driverName: "",
      driverMobile: "",
      vehicleNumber: "",
      supplier: "",
      voucherUrl: null,
    }));
    setTransfers((prev) => [...prev, ...rows]);
    notify(`${rows.length} transfer(s) loaded from quotation`, "success");
  };

  // Booked Cost lives on the Cost Sheet (one entry per service row, auto-reconciled by
  // sourceId) — this just gives each service tab a quick inline editor for that one field
  // instead of sending Operations to a separate tab for it.
  const updateBookedCost = async (sourceId: string, bookingCost: number) => {
    const entry = booking?.costSheet.find((e) => e.sourceId === sourceId);
    if (!entry) return;
    const res = await bookingsApi.saveCostSheet(id, [{ id: entry.id, bookingCost }]);
    if (!res.success) return notify(res.message || "Unable to save booked cost", "error");
    reload();
  };

  const saveVisas = async () => {
    setSavingVisas(true);
    try {
      const res = await bookingsApi.saveVisas(id, visas);
      if (!res.success) return notify(res.message || "Unable to save visas", "error");
      notify("Visas saved", "success");
      reload();
    } finally {
      setSavingVisas(false);
    }
  };
  const saveInsurances = async () => {
    setSavingInsurances(true);
    try {
      const res = await bookingsApi.saveInsurances(id, insurances);
      if (!res.success) return notify(res.message || "Unable to save insurance", "error");
      notify("Insurance saved", "success");
      reload();
    } finally {
      setSavingInsurances(false);
    }
  };

  const saveCostSheet = async (rows: { id: string; supplierName?: string; dmcCost?: number; bookingCost?: number; settlementCost?: number; sellingPrice?: number; status?: CostSheetStatus; remarks?: string | null }[]) => {
    const res = await bookingsApi.saveCostSheet(id, rows);
    if (!res.success) return notify(res.message || "Unable to save cost sheet", "error");
    notify("Cost sheet saved", "success");
    reload();
  };

  const addCustomerPayment = async (payload: { paymentDate: string; paymentMode: PaymentMode; amount: number; transactionReference?: string; remarks?: string }) => {
    const res = await bookingsApi.addCustomerPayment(id, payload);
    if (!res.success) return notify(res.message || "Unable to record payment", "error");
    notify("Customer payment recorded", "success");
    reload();
  };
  const addSupplierPayment = async (payload: { supplierName: string; paymentDate: string; amount: number; paymentMode: PaymentMode; transactionReference?: string; settlementStatus: SettlementStatus }) => {
    const res = await bookingsApi.addSupplierPayment(id, payload);
    if (!res.success) return notify(res.message || "Unable to record payment", "error");
    notify("Supplier payment recorded", "success");
    reload();
  };

  const uploadDocument = async (type: BookingDocumentType, url: string) => {
    const res = await bookingsApi.uploadDocument(id, type, url);
    if (!res.success) return notify(res.message || "Unable to upload document", "error");
    notify("Document uploaded", "success");
    reload();
  };
  const removeDocument = async (docId: string) => {
    const res = await bookingsApi.removeDocument(id, docId);
    if (!res.success) return notify(res.message || "Unable to remove document", "error");
    reload();
  };

  const addNote = async (authorName: string, message: string) => {
    const res = await bookingsApi.addNote(id, authorName, message);
    if (!res.success) return notify(res.message || "Unable to add note", "error");
    reload();
  };

  const copyWebLink = async () => {
    if (!booking?.quotation?.shareToken) return notify("No shareable quotation link yet", "error");
    const url = `${window.location.origin}/quote/${booking.quotation.shareToken}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    notify("Web quotation link copied", "success");
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Booking not found.
      </div>
    );
  }

  const shareUrl = booking.quotation?.shareToken ? `/quote/${booking.quotation.shareToken}` : null;
  const paxParts = [
    booking.quotation?.adults ? `${booking.quotation.adults} Adult${booking.quotation.adults > 1 ? "s" : ""}` : null,
    booking.quotation?.children ? `${booking.quotation.children} Child${booking.quotation.children > 1 ? "ren" : ""}` : null,
    booking.quotation?.infants ? `${booking.quotation.infants} Infant${booking.quotation.infants > 1 ? "s" : ""}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <span className="font-mono text-xs font-semibold text-slate-500">{bookingCode(booking.seq)}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{booking.lead?.customerName ?? "—"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {booking.destination?.name} · {formatINR(booking.totalAmount)} · {new Date(booking.createdDate).toLocaleDateString("en-IN")}
            </p>
          </div>
          <Link href={`/admin/bookings/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
            <Edit className="w-4 h-4" /> Edit
          </Link>
        </div>
        <BookingStatusStepper status={booking.status} onChange={changeStatus} disabled={updatingStatus} />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-5 pt-5 border-t border-slate-100 text-sm">
          <div><p className="text-xs text-slate-400 uppercase tracking-wide">Mobile</p><p className="font-medium text-slate-800">{booking.lead?.mobile ?? "—"}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wide">Email</p><p className="font-medium text-slate-800">{booking.lead?.email ?? "—"}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wide">Travel Dates</p><p className="font-medium text-slate-800">{booking.travelDate ? booking.travelDate.slice(0, 10) : "—"}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wide">Pax</p><p className="font-medium text-slate-800">{paxParts.length > 0 ? paxParts.join(", ") : "—"}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wide">Sales Executive</p><p className="font-medium text-slate-800">{booking.quotation?.salesExecutive ? `${booking.quotation.salesExecutive.firstName} ${booking.quotation.salesExecutive.lastName}` : "—"}</p></div>
          <div><p className="text-xs text-slate-400 uppercase tracking-wide">Operations Executive</p><p className="font-medium text-slate-800">{booking.bookingExecutive ? `${booking.bookingExecutive.firstName} ${booking.bookingExecutive.lastName}` : "—"}</p></div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
          {booking.quotationId && (
            <Link href={`/admin/quotations/${booking.quotationId}/edit`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <ExternalLink className="w-3.5 h-3.5" /> View Quotation
            </Link>
          )}
          {shareUrl && (
            <a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <LinkIcon className="w-3.5 h-3.5" /> Open Web Quotation
            </a>
          )}
          <button type="button" onClick={copyWebLink} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Copy className="w-3.5 h-3.5" /> Copy Web Link
          </button>
          {booking.quotationId && (
            <a href={`/api/admin/quotations/${booking.quotationId}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              <FileDown className="w-3.5 h-3.5" /> Download Quotation PDF
            </a>
          )}
          <a href={`/api/admin/bookings/${id}/voucher`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
            <FileDown className="w-3.5 h-3.5" /> Generate Voucher
          </a>
          <a href={`/api/admin/bookings/${id}/invoice?kind=customer`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
            <Mail className="w-3.5 h-3.5" /> Generate Invoice
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center overflow-x-auto px-4 py-3 gap-1 bg-slate-50/60 border-b border-slate-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">DMC Communication</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="DMC Name"><input className={inputCls} value={dmcName} onChange={(e) => setDmcName(e.target.value)} /></Field>
                  <Field label="Email Sent Date"><input type="date" className={inputCls} value={dmcEmailSentDate} onChange={(e) => setDmcEmailSentDate(e.target.value)} /></Field>
                  <Field label="Response"><input className={inputCls} value={dmcResponse} onChange={(e) => setDmcResponse(e.target.value)} /></Field>
                  <Field label="Remarks"><input className={inputCls} value={dmcRemarks} onChange={(e) => setDmcRemarks(e.target.value)} /></Field>
                </div>
                <button type="button" onClick={saveDmc} disabled={savingDmc} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  Save DMC Details
                </button>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Activity</h3>
                <BookingTimelineTab events={booking.timeline.slice(0, 5)} />
              </div>
            </div>
          )}

          {tab === "costsheet" && (
            <BookingCostSheet
              entries={booking.costSheet.map((c) => ({ ...c, profit: c.sellingPrice - c.dmcCost }))}
              onSave={saveCostSheet}
            />
          )}

          {tab === "flights" && (
            <TabSaveWrapper onSave={saveFlights} saving={savingFlights} label="Save Flights">
              <BookingFlightsEditor flights={flights} onChange={setFlights} />
            </TabSaveWrapper>
          )}
          {tab === "hotels" && (
            <TabSaveWrapper
              onSave={saveHotels}
              saving={savingHotels}
              label="Save Hotels"
              extra={booking.quotation && booking.quotation.hotelOptions.some((g) => g.hotels.length > 0) ? (
                <LoadFromQuotationButton onClick={loadHotelsFromQuotation} />
              ) : null}
            >
              <BookingHotelsEditor hotels={hotels} onChange={setHotels} costSheet={booking.costSheet} onBookedCostChange={updateBookedCost} />
            </TabSaveWrapper>
          )}
          {tab === "activities" && (
            <TabSaveWrapper
              onSave={saveActivities}
              saving={savingActivities}
              label="Save Activities"
              extra={booking.quotation && booking.quotation.activities.length > 0 ? (
                <LoadFromQuotationButton onClick={loadActivitiesFromQuotation} />
              ) : null}
            >
              <BookingActivitiesEditor activities={activities} onChange={setActivities} costSheet={booking.costSheet} onBookedCostChange={updateBookedCost} />
            </TabSaveWrapper>
          )}
          {tab === "transfers" && (
            <TabSaveWrapper
              onSave={saveTransfers}
              saving={savingTransfers}
              label="Save Transfers"
              extra={booking.quotation && booking.quotation.transfers.length > 0 ? (
                <LoadFromQuotationButton onClick={loadTransfersFromQuotation} />
              ) : null}
            >
              <BookingTransfersEditor transfers={transfers} onChange={setTransfers} costSheet={booking.costSheet} onBookedCostChange={updateBookedCost} />
            </TabSaveWrapper>
          )}
          {tab === "visa" && (
            <TabSaveWrapper onSave={saveVisas} saving={savingVisas} label="Save Visas">
              <BookingVisasEditor visas={visas} onChange={setVisas} />
            </TabSaveWrapper>
          )}
          {tab === "insurance" && (
            <TabSaveWrapper onSave={saveInsurances} saving={savingInsurances} label="Save Insurance">
              <BookingInsurancesEditor insurances={insurances} onChange={setInsurances} />
            </TabSaveWrapper>
          )}
          {tab === "payments" && (
            <BookingPayments
              customerPayments={booking.customerPayments}
              supplierPayments={booking.supplierPayments}
              onAddCustomerPayment={addCustomerPayment}
              onAddSupplierPayment={addSupplierPayment}
            />
          )}
          {tab === "documents" && (
            <BookingDocumentsTab
              bookingId={id}
              documents={booking.documents}
              onUpload={uploadDocument}
              onRemove={removeDocument}
              quotationId={booking.quotationId ?? null}
              shareUrl={shareUrl}
            />
          )}
          {tab === "chat" && (
            <BookingChatTab notes={booking.notes} onAddNote={addNote} authorName={booking.bookingExecutive ? `${booking.bookingExecutive.firstName} ${booking.bookingExecutive.lastName}` : "Team"} />
          )}
          {tab === "timeline" && <BookingTimelineTab events={booking.timeline} />}
        </div>
      </div>
    </div>
  );
}

/** Wraps a per-service editor with a persistent "Save" bar — the editor's onChange only touches local state, this is the only thing that hits the server. */
function TabSaveWrapper({
  children,
  onSave,
  saving,
  label,
  extra,
}: {
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
  label: string;
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {extra && <div className="flex justify-end">{extra}</div>}
      {children}
      <div className="pt-2 border-t border-slate-100">
        <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> {label}
        </button>
      </div>
    </div>
  );
}

/** Pulls the corresponding service list in from the linked Quotation — additive, never overwrites what's already here. */
function LoadFromQuotationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
    >
      <Download className="w-3.5 h-3.5" /> Load from Quotation
    </button>
  );
}
