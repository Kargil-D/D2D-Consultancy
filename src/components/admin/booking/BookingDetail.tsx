"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  FileDown, Mail, Copy, Link as LinkIcon, ExternalLink, Save, Download,
  Wallet, Plane, BedDouble, Ticket, ArrowRightLeft, Stamp, ShieldCheck,
  CreditCard, FolderOpen, MessageCircle, History,
} from "lucide-react";
import { Field, inputCls, selectCls, textareaCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import BookingStatusStepper from "@/components/admin/booking/BookingStatusStepper";
import BookingFlightsEditor from "@/components/admin/booking/BookingFlightsEditor";
import BookingHotelsEditor, { type HotelQuotationMeta } from "@/components/admin/booking/BookingHotelsEditor";
import BookingActivitiesEditor, { type ActivityQuotationMeta } from "@/components/admin/booking/BookingActivitiesEditor";
import BookingTransfersEditor, { type TransferQuotationMeta } from "@/components/admin/booking/BookingTransfersEditor";
import BookingVisasEditor from "@/components/admin/booking/BookingVisasEditor";
import BookingInsurancesEditor from "@/components/admin/booking/BookingInsurancesEditor";
import BookingCostSheet from "@/components/admin/booking/BookingCostSheet";
import BookingPayments from "@/components/admin/booking/BookingPayments";
import BookingDocumentsTab from "@/components/admin/booking/BookingDocumentsTab";
import BookingChatTab from "@/components/admin/booking/BookingChatTab";
import BookingTimelineTab from "@/components/admin/booking/BookingTimelineTab";
import UserSearchSelect from "@/components/admin/ui/UserSearchSelect";
import { bookingsApi, quotationsApi, salesUsersApi, currenciesApi } from "@/lib/adminApi";
import type {
  AdminBooking, AdminBookingActivity, AdminBookingFlight, AdminBookingHotel, AdminBookingInsurance,
  AdminBookingTransfer, AdminBookingVisa, AdminQuotation, AdminSalesUser, BookingDocumentType, BookingStatus,
  CostSheetStatus, PaymentMode,
} from "@/types/admin";

interface BookingDetailProps {
  id: string;
}

const bookingCode = (seq: number) => `BK-${seq.toString().padStart(4, "0")}`;
const leadCode = (seq: number) => `LD-${seq.toString().padStart(4, "0")}`;
const quoteCode = (seq: number) => `QT-${seq.toString().padStart(4, "0")}`;
const formatINR = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", currencyDisplay: "code", maximumFractionDigits: 0 }).format(v);

const STATUSES: BookingStatus[] = ["Won", "Booked", "OnTrip", "Completed", "Cancelled"];

const TABS = [
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
  const [tab, setTab] = useState<TabKey>("costsheet");

  const [dmcName, setDmcName] = useState("");
  const [dmcEmailSentDate, setDmcEmailSentDate] = useState("");
  const [dmcResponse, setDmcResponse] = useState("");
  const [dmcRemarks, setDmcRemarks] = useState("");
  const [savingDmc, setSavingDmc] = useState(false);

  // Booking Details (merged in from the former standalone Edit Booking page/route).
  const [quotations, setQuotations] = useState<AdminQuotation[]>([]);
  const [bookingExecutives, setBookingExecutives] = useState<AdminSalesUser[]>([]);
  const [customerSupportUsers, setCustomerSupportUsers] = useState<AdminSalesUser[]>([]);
  const [detailQuotationId, setDetailQuotationId] = useState("");
  const [detailTravelDate, setDetailTravelDate] = useState("");
  const [detailStatus, setDetailStatus] = useState<BookingStatus>("Won");
  const [detailBookingExecutiveId, setDetailBookingExecutiveId] = useState("");
  const [detailCustomerSupportId, setDetailCustomerSupportId] = useState("");
  const [detailTotalAmount, setDetailTotalAmount] = useState(0);
  const [detailRemarks, setDetailRemarks] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  // Local drafts for each service list — the editors below only touch these on every
  // keystroke; each tab has its own explicit Save button that pushes to the server,
  // same pattern as the original single "Save Components" table.
  const [flights, setFlights] = useState<AdminBookingFlight[]>([]);
  const [hotels, setHotels] = useState<AdminBookingHotel[]>([]);
  const hotelsAutoLoadedRef = useRef(false);
  const [activities, setActivities] = useState<AdminBookingActivity[]>([]);
  const activitiesAutoLoadedRef = useRef(false);
  const [transfers, setTransfers] = useState<AdminBookingTransfer[]>([]);
  const transfersAutoLoadedRef = useRef(false);
  const [currencyOptions, setCurrencyOptions] = useState<string[]>(["INR"]);
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
      setDetailQuotationId(b.quotationId ?? "");
      setDetailTravelDate(b.travelDate ? b.travelDate.slice(0, 10) : "");
      setDetailStatus(b.status);
      setDetailBookingExecutiveId(b.bookingExecutiveId ?? "");
      setDetailCustomerSupportId(b.customerSupportId ?? "");
      setDetailTotalAmount(b.totalAmount);
      setDetailRemarks(b.remarks ?? "");
      setFlights(b.flights);
      setHotels(b.hotels.map((h) => ({ ...h, checkIn: h.checkIn?.slice(0, 10) ?? null, checkOut: h.checkOut?.slice(0, 10) ?? null, bookingDate: h.bookingDate?.slice(0, 10) ?? null })));
      setActivities(b.activities.map((a) => ({ ...a, activityDate: a.activityDate?.slice(0, 10) ?? null, bookingDate: a.bookingDate?.slice(0, 10) ?? null })));
      setTransfers(b.transfers.map((t) => ({ ...t, bookingDate: t.bookingDate?.slice(0, 10) ?? null })));
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

  useEffect(() => {
    (async () => {
      const [beRes, csRes] = await Promise.all([
        salesUsersApi.list("BookingExecutive"),
        salesUsersApi.list("CustomerSupport"),
      ]);
      if (beRes.success) setBookingExecutives(beRes.data);
      if (csRes.success) setCustomerSupportUsers(csRes.data);
    })();
    currenciesApi.list({ pageSize: 100, filter: { status: "Active" } }).then((res) => {
      if (res.success) {
        const codes = res.data.items.map((c) => c.code);
        setCurrencyOptions(codes.includes("INR") ? codes : ["INR", ...codes]);
      }
    });
  }, []);

  // Load quotations for the booking's lead (the "Quotation" dropdown) — merge in the
  // currently-linked quotation so it still shows even if it falls outside the list.
  useEffect(() => {
    if (!booking?.leadId) return;
    quotationsApi.list({ leadId: booking.leadId, pageSize: 100 }).then((res) => {
      if (!res.success) return;
      setQuotations(() => {
        const items = res.data.items;
        if (booking.quotation && !items.some((q) => q.id === booking.quotation!.id)) {
          return [...items, booking.quotation];
        }
        return items;
      });
    });
  }, [booking?.leadId, booking?.quotation]);

  const selectedQuotation = quotations.find((q) => q.id === detailQuotationId) ?? null;

  useEffect(() => {
    hotelsAutoLoadedRef.current = false;
    activitiesAutoLoadedRef.current = false;
    transfersAutoLoadedRef.current = false;
  }, [id]);

  // One-time auto-load: if this booking has no hotel rows yet and its Quotation has hotel
  // options, copy them in once (reusing the Quotation hotel selection's own id as the
  // booking row's id, so the D2D Cost/Currency/Total Cost columns can mirror the matching
  // QuotationItem by sourceId). After this first load, rows are fully independent — edits
  // here never write back to the Quotation.
  useEffect(() => {
    if (hotelsAutoLoadedRef.current) return;
    if (!booking) return;
    if (hotels.length > 0) {
      hotelsAutoLoadedRef.current = true;
      return;
    }
    if (!selectedQuotation) return;
    hotelsAutoLoadedRef.current = true;
    const rows: AdminBookingHotel[] = selectedQuotation.hotelOptions.flatMap((g) =>
      g.hotels.map((h) => ({
        id: h.id,
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
        bookedCurrency: "INR",
        paymentMode: "Cash",
        bookingDate: null,
        bookingPnr: "",
        updatedBy: "",
      })),
    );
    if (rows.length > 0) setHotels(rows);
  }, [booking, hotels.length, selectedQuotation]);

  const hotelQuotationMeta = new Map<string, HotelQuotationMeta>();
  if (selectedQuotation) {
    for (const g of selectedQuotation.hotelOptions) {
      for (const h of g.hotels) {
        const item = selectedQuotation.items.find((it) => it.sourceId === h.id);
        hotelQuotationMeta.set(h.id, {
          optionLabel: g.label,
          currencyCode: item?.currencyCode ?? "INR",
          cost: item?.cost ?? 0,
          qty: item?.qty ?? h.nights,
        });
      }
    }
  }

  // Same one-time auto-load as hotels above, reusing the Quotation activity's own id as the
  // booking row's id so D2D Cost/Total Cost can mirror the matching QuotationItem by sourceId.
  useEffect(() => {
    if (activitiesAutoLoadedRef.current) return;
    if (!booking) return;
    if (activities.length > 0) {
      activitiesAutoLoadedRef.current = true;
      return;
    }
    if (!selectedQuotation) return;
    activitiesAutoLoadedRef.current = true;
    const rows: AdminBookingActivity[] = selectedQuotation.activities.map((a) => ({
      id: a.id,
      activityName: a.name,
      activityDate: a.activityDate || null,
      activityTime: a.activityTime,
      duration: a.duration,
      tourType: "Private",
      pickupIncluded: false,
      pickupTime: a.reportingTime,
      pax: a.pax || 1,
      supplier: "",
      voucherUrl: null,
      invoiceUrl: null,
      bookedCurrency: "INR",
      paymentMode: "Cash",
      bookingDate: null,
      bookingPnr: "",
      updatedBy: "",
    }));
    if (rows.length > 0) setActivities(rows);
  }, [booking, activities.length, selectedQuotation]);

  // Same one-time auto-load as hotels above, reusing the Quotation transfer's own id as the
  // booking row's id so D2D Cost/Total Cost can mirror the matching QuotationItem by sourceId.
  useEffect(() => {
    if (transfersAutoLoadedRef.current) return;
    if (!booking) return;
    if (transfers.length > 0) {
      transfersAutoLoadedRef.current = true;
      return;
    }
    if (!selectedQuotation) return;
    transfersAutoLoadedRef.current = true;
    const rows: AdminBookingTransfer[] = selectedQuotation.transfers.map((t) => ({
      id: t.id,
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
      invoiceUrl: null,
      bookedCurrency: "INR",
      paymentMode: "Cash",
      bookingDate: null,
      bookingPnr: "",
      updatedBy: "",
    }));
    if (rows.length > 0) setTransfers(rows);
  }, [booking, transfers.length, selectedQuotation]);

  const activityQuotationMeta = new Map<string, ActivityQuotationMeta>();
  const transferQuotationMeta = new Map<string, TransferQuotationMeta>();
  if (selectedQuotation) {
    for (const a of selectedQuotation.activities) {
      const item = selectedQuotation.items.find((it) => it.sourceId === a.id);
      activityQuotationMeta.set(a.id, { cost: item?.cost ?? 0, qty: item?.qty ?? 1 });
    }
    for (const t of selectedQuotation.transfers) {
      const item = selectedQuotation.items.find((it) => it.sourceId === t.id);
      transferQuotationMeta.set(t.id, { cost: item?.cost ?? 0, qty: item?.qty ?? 1 });
    }
  }

  // Selling Price on the Cost Sheet mirrors D2D Cost (qty × cost) for services that have one
  // (Hotel/Activity/Transfer, sourced from the linked Quotation) — Flight/Visa/Insurance have
  // no quotation cost mirroring yet, so those rows keep a manually-entered Selling Price.
  const d2dCostBySourceId = new Map<string, number>();
  for (const [id, m] of hotelQuotationMeta) d2dCostBySourceId.set(id, m.qty * m.cost);
  for (const [id, m] of activityQuotationMeta) d2dCostBySourceId.set(id, m.qty * m.cost);
  for (const [id, m] of transferQuotationMeta) d2dCostBySourceId.set(id, m.qty * m.cost);

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

  const saveDetails = async () => {
    if (!booking) return;
    setSavingDetails(true);
    try {
      const res = await bookingsApi.update(id, {
        quotationId: detailQuotationId || null,
        travelDate: detailTravelDate || null,
        bookingExecutiveId: detailBookingExecutiveId || null,
        customerSupportId: detailCustomerSupportId || null,
        totalAmount: detailTotalAmount,
        remarks: detailRemarks,
      });
      if (!res.success) return notify(res.message || "Unable to update booking", "error");
      if (detailStatus !== booking.status) await bookingsApi.updateStatus(id, detailStatus);
      notify("Booking details updated", "success");
      reload();
    } finally {
      setSavingDetails(false);
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
  const loadActivitiesFromQuotation = () => {
    if (!booking?.quotation) return;
    const existingIds = new Set(activities.map((a) => a.id));
    const rows: AdminBookingActivity[] = booking.quotation.activities
      .filter((a) => !existingIds.has(a.id))
      .map((a) => ({
        id: a.id,
        activityName: a.name,
        activityDate: a.activityDate || null,
        activityTime: a.activityTime,
        duration: a.duration,
        tourType: "Private",
        pickupIncluded: false,
        pickupTime: a.reportingTime,
        pax: a.pax || 1,
        supplier: "",
        voucherUrl: null,
        invoiceUrl: null,
        bookedCurrency: "INR",
        paymentMode: "Cash",
        bookingDate: null,
        bookingPnr: "",
        updatedBy: "",
      }));
    setActivities((prev) => [...prev, ...rows]);
    notify(`${rows.length} activity(ies) loaded from quotation`, "success");
  };

  const loadTransfersFromQuotation = () => {
    if (!booking?.quotation) return;
    const existingIds = new Set(transfers.map((t) => t.id));
    const rows: AdminBookingTransfer[] = booking.quotation.transfers
      .filter((t) => !existingIds.has(t.id))
      .map((t) => ({
        id: t.id,
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
        invoiceUrl: null,
        bookedCurrency: "INR",
        paymentMode: "Cash",
        bookingDate: null,
        bookingPnr: "",
        updatedBy: "",
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

  const updateSettlementCost = async (sourceId: string, settlementCost: number) => {
    const entry = booking?.costSheet.find((e) => e.sourceId === sourceId);
    if (!entry) return;
    const res = await bookingsApi.saveCostSheet(id, [{ id: entry.id, settlementCost }]);
    if (!res.success) return notify(res.message || "Unable to save settlement cost", "error");
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

  const saveCostSheet = async (rows: { id: string; supplierName?: string; bookingCost?: number; settlementCost?: number; sellingPrice?: number; status?: CostSheetStatus; remarks?: string | null }[]) => {
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
  const uploadDocument = async (type: BookingDocumentType, url: string, description?: string) => {
    const res = await bookingsApi.uploadDocument(id, type, url, description);
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

  // Margin/Deal Price mirror the linked Quotation's own pricing step (cost -> +margin -> +GST = grand total);
  // Total Paid is the Payments tab's Customer Payments total (same figure shown there).
  const quotePricing = selectedQuotation
    ? (() => {
        const cost = selectedQuotation.items.reduce((sum, i) => sum + i.qty * i.cost, 0);
        const marginValue = Math.round(cost * (selectedQuotation.marginPercent / 100));
        const subtotal = cost + marginValue;
        const gstValue = Math.round(subtotal * (selectedQuotation.gstPercent / 100));
        const sellingPrice = subtotal + gstValue;
        return { marginValue, sellingPrice };
      })()
    : null;
  const totalPaid = booking.customerPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Identity + quick actions */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="font-mono text-xs font-semibold text-slate-500">{bookingCode(booking.seq)}</span>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{booking.lead?.customerName ?? "—"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {booking.destination?.name} · {formatINR(booking.totalAmount)} · {new Date(booking.createdDate).toLocaleDateString("en-IN")}
            </p>
          </div>
          {quotePricing && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Margin</div>
                <div className="text-lg font-bold text-slate-900">{formatINR(quotePricing.marginValue)}</div>
              </div>
              <div className="w-px h-9 bg-slate-200" />
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deal Price</div>
                <div className="text-lg font-bold text-slate-900">{formatINR(quotePricing.sellingPrice)}</div>
              </div>
              <div className="w-px h-9 bg-slate-200" />
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Paid</div>
                <div className="text-lg font-bold text-emerald-600">{formatINR(totalPaid)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100">
          <BookingStatusStepper status={booking.status} onChange={changeStatus} disabled={updatingStatus} />
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

      {/* 1. Booking Details (editable — merged in from the former standalone Edit Booking page) */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Booking Details</h2>
          <button
            type="button"
            onClick={saveDetails}
            disabled={savingDetails}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Update
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Won Lead">
              <input className={inputCls} value={booking.lead ? `${leadCode(booking.lead.seq)} — ${booking.lead.customerName}` : ""} disabled />
            </Field>
            <Field label="Quotation" hint="Optional — the winning quote">
              <select className={selectCls} value={detailQuotationId} onChange={(e) => setDetailQuotationId(e.target.value)}>
                <option value="">No quotation</option>
                {quotations.map((q) => (
                  <option key={q.id} value={q.id}>{quoteCode(q.seq)}</option>
                ))}
              </select>
            </Field>
            <Field label="Customer">
              <input className={inputCls} value={booking.lead?.customerName ?? ""} disabled />
            </Field>
            <Field label="Destination">
              <input className={inputCls} value={booking.destination?.name ?? ""} disabled />
            </Field>
            <Field label="Mobile">
              <input className={inputCls} value={booking.lead?.mobile ?? ""} disabled />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={booking.lead?.email ?? ""} disabled />
            </Field>
            <Field label="Travel Date">
              <input type="date" className={inputCls} value={detailTravelDate} onChange={(e) => setDetailTravelDate(e.target.value)} />
            </Field>
            <Field label="Booking Status">
              <select className={selectCls} value={detailStatus} onChange={(e) => setDetailStatus(e.target.value as BookingStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Pax">
              <input className={inputCls} value={paxParts.length > 0 ? paxParts.join(", ") : ""} disabled />
            </Field>
            <Field label="Sales Executive">
              <input className={inputCls} value={booking.quotation?.salesExecutive ? `${booking.quotation.salesExecutive.firstName} ${booking.quotation.salesExecutive.lastName}` : ""} disabled />
            </Field>
            <Field label="Assign Operations Executive">
              <UserSearchSelect
                users={bookingExecutives}
                value={detailBookingExecutiveId}
                onChange={setDetailBookingExecutiveId}
                placeholder="Search Operations Executive…"
              />
            </Field>
            <Field label="Assign Customer Support">
              <UserSearchSelect
                users={customerSupportUsers}
                value={detailCustomerSupportId}
                onChange={setDetailCustomerSupportId}
                placeholder="Search Customer Support…"
              />
            </Field>
            <Field label="Total Amount (INR)">
              <input type="number" min={0} className={inputCls} value={detailTotalAmount} onChange={(e) => setDetailTotalAmount(Number(e.target.value) || 0)} />
            </Field>
          </div>

          <Field label="Remarks">
            <textarea className={textareaCls} value={detailRemarks} onChange={(e) => setDetailRemarks(e.target.value)} rows={4} />
          </Field>
        </div>
      </div>

      {/* 2. Overview */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Overview</h2>
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
      </div>

      {/* Remaining service tabs */}
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
          {tab === "costsheet" && (
            <BookingCostSheet
              entries={booking.costSheet.map((c) => {
                const sellingPrice = d2dCostBySourceId.get(c.sourceId) ?? c.sellingPrice;
                return { ...c, sellingPrice, profit: sellingPrice - c.bookingCost };
              })}
              d2dCostBySourceId={d2dCostBySourceId}
              onSave={saveCostSheet}
            />
          )}

          {tab === "flights" && (
            <TabSaveWrapper onSave={saveFlights} saving={savingFlights} label="Save Flights">
              <BookingFlightsEditor flights={flights} onChange={setFlights} />
            </TabSaveWrapper>
          )}
          {tab === "hotels" && (
            <TabSaveWrapper onSave={saveHotels} saving={savingHotels} label="Save Hotels">
              <BookingHotelsEditor
                hotels={hotels}
                onChange={setHotels}
                costSheet={booking.costSheet}
                onBookedCostChange={updateBookedCost}
                onSettlementCostChange={updateSettlementCost}
                quotationMeta={hotelQuotationMeta}
                currencyOptions={currencyOptions}
              />
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
              <BookingActivitiesEditor
                bookingId={id}
                activities={activities}
                onChange={setActivities}
                costSheet={booking.costSheet}
                onBookedCostChange={updateBookedCost}
                onSettlementCostChange={updateSettlementCost}
                quotationMeta={activityQuotationMeta}
                currencyOptions={currencyOptions}
              />
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
              <BookingTransfersEditor
                bookingId={id}
                transfers={transfers}
                onChange={setTransfers}
                costSheet={booking.costSheet}
                onBookedCostChange={updateBookedCost}
                onSettlementCostChange={updateSettlementCost}
                quotationMeta={transferQuotationMeta}
                currencyOptions={currencyOptions}
              />
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
              onAddCustomerPayment={addCustomerPayment}
              dealPrice={quotePricing?.sellingPrice}
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
