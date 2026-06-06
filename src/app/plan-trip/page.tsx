"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Languages,
  MapPin,
  Plane,
  Send,
  UserRound,
  Users,
} from "lucide-react";

import Logo from "@/components/common/Logo";
import StepperTabs, {
  type StepDefinition,
} from "@/components/planner/StepperTabs";
import TravellerSelector from "@/components/travellers/TravellerSelector";
import TravellerCountSelector from "@/components/travellers/TravellerCountSelector";
import FamilyTravellerSelector from "@/components/travellers/FamilyTravellerSelector";
import DurationSelector from "@/components/duration/DurationSelector";
import DepartureCitySelector from "@/components/departure/DepartureCitySelector";
import LanguageSelector from "@/components/language/LanguageSelector";
import DepartureDatePicker from "@/components/calendar/DepartureDatePicker";
import CustomerDetailsForm from "@/components/customer/CustomerDetailsForm";
import type { PlannerState, TravellerId } from "@/types";
import {
  DURATION_OPTIONS,
  LANGUAGE_OPTIONS,
  TRAVELLER_OPTIONS,
  TRAVELLER_COUNT_RULES,
} from "@/data/planner";
import { submitEnquiry } from "@/services/enquiryService";
import { toSlug } from "@/utils/slug";

const STEPS: StepDefinition[] = [
  { id: "travellers", label: "Travellers", icon: Users },
  { id: "duration", label: "Duration", icon: Calendar },
  { id: "city", label: "Departure City", icon: MapPin },
  { id: "language", label: "Language", icon: Languages },
  { id: "date", label: "Departure Date", icon: CalendarDays },
  { id: "contact", label: "Your Details", icon: UserRound },
];

const STEP_TITLES = [
  {
    title: "Who's travelling with you?",
    subtitle: "Choose the group that best describes your trip.",
  },
  {
    title: "How long will you travel?",
    subtitle: "Pick a duration that fits your schedule.",
  },
  {
    title: "Where are you flying from?",
    subtitle: "Select your nearest departure city.",
  },
  {
    title: "Which language should your expert speak?",
    subtitle: "We'll match you with a planner who speaks your language.",
  },
  {
    title: "When would you like to depart?",
    subtitle: "Pick a future date that works for you.",
  },
  {
    title: "Almost there â€” your contact details",
    subtitle: "We'll share the perfect packages with you on email.",
  },
] as const;

function PlanTripContent() {
  const params = useSearchParams();
  const destination = params.get("destination") ?? "your dream destination";

  const [state, setState] = useState<PlannerState>({
    destination,
    traveller: null,
    travellerCount: null,
    childrenCount: null,
    duration: null,
    city: null,
    language: null,
    date: null,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [step, setStep] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Per-step completion validity
  const validity = useMemo(() => {
    const trav = state.traveller;
    const count = state.travellerCount;
    let travellerOk = false;
    if (trav && count != null) {
      const rule = TRAVELLER_COUNT_RULES[trav];
      travellerOk = count >= rule.min && count <= rule.max;
    }
    const contactOk =
      state.customerName.trim().length > 1 &&
      /^\S+@\S+\.\S+$/.test(state.customerEmail) &&
      /^[+\d\s-]{7,}$/.test(state.customerPhone);

    // Custom duration requires a positive day count (stored as "custom-<N>").
    const durationOk = !!state.duration && state.duration !== "custom";

    return [
      travellerOk,
      durationOk,
      Boolean(state.city),
      Boolean(state.language),
      Boolean(state.date),
      contactOk,
    ];
  }, [state]);

  // When traveller TYPE changes, auto-set count to that type's default
  // (Couple = 2, Solo = 1, Family = 2 adults + 0 kids, Friends = 2). User can adjust later.
  const handleTravellerChange = (traveller: TravellerId) => {
    const rule = TRAVELLER_COUNT_RULES[traveller];
    setState((s) => ({
      ...s,
      traveller,
      travellerCount: traveller === "family" ? 2 : rule.default,
      childrenCount: traveller === "family" ? 0 : null,
    }));
  };

  const completed = validity.map((v, i) => v && i < step) as boolean[];

  const next = () => {
    if (!validity[step]) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const prev = () => step > 0 && setStep((s) => s - 1);

  const submit = async () => {
    if (!validity.every(Boolean) || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitEnquiry({
        destination: state.destination,
        travellerType: state.traveller!,
        travellerCount:
          state.traveller === "family"
            ? (state.travellerCount ?? 0) + (state.childrenCount ?? 0)
            : state.travellerCount!,
        adultsCount:
          state.traveller === "family" ? state.travellerCount! : undefined,
        childrenCount:
          state.traveller === "family"
            ? state.childrenCount ?? 0
            : undefined,
        duration: formatDurationForPayload(state.duration!),
        departureCity: state.city!,
        language: state.language
          ? LANGUAGE_OPTIONS.find((l) => l.id === state.language)?.label ??
            state.language
          : undefined,
        departureDate: state.date!,
        customerName: state.customerName.trim(),
        customerEmail: state.customerEmail.trim(),
        customerPhone: state.customerPhone.trim(),
      });
      if (!result.ok) {
        setSubmitError(result.message ?? "Submission failed. Please try again.");
        return;
      }
      setSuccess(true);
      // Brief success screen, then redirect to the destination landing page.
      // Use window.location for a guaranteed full navigation (router.push can
      // get stuck behind the success modal in some edge cases).
      const targetUrl = `/destinations/${toSlug(state.destination)}`;
      console.info("[planner] redirecting to", targetUrl);
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1500);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50/40">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex items-center pointer-events-auto"
          >
            <Logo size="sm" tone="dark" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:text-cyan-600 hover:bg-cyan-50 transition-colors pointer-events-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        {/* Destination chip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold tracking-widest uppercase">
            <Plane className="w-3.5 h-3.5" />
            Customizing your trip to
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
            {destination}
          </h1>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            Just a few quick steps and our experts will craft the perfect itinerary.
          </p>
        </motion.div>

        {/* Stepper */}
        <div className="mt-10">
          <StepperTabs
            steps={STEPS}
            current={step}
            completed={completed}
            onStepClick={(i) => {
              // Allow jumping back to past steps or current
              if (i <= step || validity.slice(0, i).every(Boolean)) setStep(i);
            }}
          />
        </div>

        {/* Card body */}
        <div className="mt-10 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-900/5 p-6 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {STEP_TITLES[step].title}
            </h2>
            <p className="mt-2 text-slate-500">{STEP_TITLES[step].subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <div>
                  <TravellerSelector
                    value={state.traveller}
                    onChange={handleTravellerChange}
                  />

                  {/* Family gets the Adults + Children card; Friends keeps
                      the single +/- count picker. Couple and Solo are locked. */}
                  <AnimatePresence>
                    {state.traveller === "family" && (
                      <FamilyTravellerSelector
                        key="family"
                        adults={state.travellerCount ?? 2}
                        kids={state.childrenCount ?? 0}
                        minAdults={1}
                        maxAdults={TRAVELLER_COUNT_RULES.family.max}
                        onChange={({ adults, kids }) =>
                          setState((s) => ({
                            ...s,
                            travellerCount: adults,
                            childrenCount: kids,
                          }))
                        }
                      />
                    )}
                    {state.traveller &&
                      state.traveller !== "family" &&
                      !TRAVELLER_COUNT_RULES[state.traveller].locked && (
                        <TravellerCountSelector
                          key={state.traveller}
                          value={
                            state.travellerCount ??
                            TRAVELLER_COUNT_RULES[state.traveller].default
                          }
                          min={TRAVELLER_COUNT_RULES[state.traveller].min}
                          max={TRAVELLER_COUNT_RULES[state.traveller].max}
                          onChange={(travellerCount) =>
                            setState((s) => ({ ...s, travellerCount }))
                          }
                        />
                      )}
                  </AnimatePresence>

                  {/* Live summary text */}
                  {state.traveller && state.travellerCount != null && (
                    <p className="mt-6 text-center text-sm font-medium text-slate-600">
                      <span className="text-cyan-600 font-bold">
                        {travellerSummary(
                          state.traveller,
                          state.travellerCount,
                          state.childrenCount ?? 0,
                        )}
                      </span>
                    </p>
                  )}
                </div>
              )}
              {step === 1 && (
                <DurationSelector
                  value={state.duration}
                  onChange={(duration) =>
                    setState((s) => ({ ...s, duration }))
                  }
                />
              )}
              {step === 2 && (
                <DepartureCitySelector
                  value={state.city}
                  onChange={(city) => setState((s) => ({ ...s, city }))}
                />
              )}
              {step === 3 && (
                <LanguageSelector
                  value={state.language}
                  onChange={(language) =>
                    setState((s) => ({ ...s, language }))
                  }
                />
              )}
              {step === 4 && (
                <DepartureDatePicker
                  value={state.date}
                  onChange={(date) => setState((s) => ({ ...s, date }))}
                />
              )}
              {step === 5 && (
                <CustomerDetailsForm
                  name={state.customerName}
                  email={state.customerEmail}
                  phone={state.customerPhone}
                  onChange={(patch) =>
                    setState((s) => ({
                      ...s,
                      customerName: patch.name ?? s.customerName,
                      customerEmail: patch.email ?? s.customerEmail,
                      customerPhone: patch.phone ?? s.customerPhone,
                    }))
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={submit}
                disabled={!validity.every(Boolean) || submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Sending enquiry...
                  </>
                ) : (
                  <>
                    Find Packages
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                disabled={!validity[step]}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: {STEPS[step + 1].label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {!validity[step] && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Please make a selection to continue.
            </p>
          )}

          {submitError && (
            <p className="mt-3 text-center text-sm text-rose-600">
              {submitError}
            </p>
          )}
        </div>

        {/* Live summary */}
        <PlannerSummary state={state} />
      </section>

      {/* Success / redirect overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", damping: 22, stiffness: 240 }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 14, stiffness: 200 }}
                className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40"
              >
                <CheckCircle2 className="w-9 h-9" strokeWidth={2.2} />
              </motion.div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">
                Enquiry sent successfully!
              </h3>
              <div className="mt-6 flex items-center justify-center gap-2 text-cyan-600">
                <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  Loading destination
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/** Normalise the duration value sent to email/Google Form so "custom-9" becomes "9 Days". */
function formatDurationForPayload(value: string): string {
  if (value.startsWith("custom-")) {
    const days = Number(value.slice("custom-".length));
    if (Number.isFinite(days) && days > 0) return `${days} Days (Custom)`;
  }
  const opt = DURATION_OPTIONS.find((d) => d.id === value);
  return opt?.label ?? value;
}

/** Friendly per-type summary text shown under the traveller cards. */
function travellerSummary(
  type: TravellerId,
  count: number,
  children = 0,
): string {
  switch (type) {
    case "couple":
      return "2 travellers selected";
    case "solo":
      return "Travelling solo";
    case "family": {
      const adultLabel = `${count} adult${count === 1 ? "" : "s"}`;
      if (children <= 0) return `${adultLabel} travelling`;
      const kidLabel = `${children} ${children === 1 ? "child" : "children"}`;
      return `${adultLabel} + ${kidLabel}`;
    }
    case "friends":
      return `${count} friends travelling together`;
  }
}

function PlannerSummary({ state }: { state: PlannerState }) {
  const traveller = TRAVELLER_OPTIONS.find((t) => t.id === state.traveller);
  const duration = DURATION_OPTIONS.find((d) => d.id === state.duration);

  const travellersValue =
    traveller && state.travellerCount != null
      ? state.traveller === "family"
        ? `${traveller.title} Â· ${state.travellerCount}A${
            state.childrenCount ? ` + ${state.childrenCount}C` : ""
          }`
        : `${traveller.title} Â· ${state.travellerCount} pax`
      : traveller?.title;

  // For custom durations, prefer the explicit day count entered by the user.
  let durationValue: string | undefined = duration?.label;
  if (state.duration?.startsWith("custom-")) {
    const days = Number(state.duration.slice("custom-".length));
    if (Number.isFinite(days) && days > 0) {
      durationValue = `${days} Days (Custom)`;
    }
  } else if (state.duration === "custom") {
    durationValue = undefined;
  }

  const languageLabel = state.language
    ? LANGUAGE_OPTIONS.find((l) => l.id === state.language)?.label ??
      state.language
    : undefined;

  const items = [
    { label: "Destination", value: state.destination, icon: Plane },
    { label: "Travellers", value: travellersValue, icon: Users },
    { label: "Duration", value: durationValue, icon: Calendar },
    { label: "From", value: state.city, icon: MapPin },
    { label: "Language", value: languageLabel, icon: Languages },
    { label: "Date", value: state.date, icon: CalendarDays },
  ];

  return (
    <div className="mt-8 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl">
      <div className="text-xs font-semibold uppercase tracking-widest text-cyan-300 mb-4">
        Your trip summary
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/10 text-cyan-300 flex-shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {label}
              </div>
              <div className="text-sm font-semibold truncate">
                {value || "Ã¢â‚¬â€"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * useSearchParams() requires a Suspense boundary in the App Router.
 */
export default function PlanTripPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            Loading planner...
          </div>
        </div>
      }
    >
      <PlanTripContent />
    </Suspense>
  );
}
