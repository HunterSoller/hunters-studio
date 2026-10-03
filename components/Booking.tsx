"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Reveal from "@/components/studio/Reveal";
import SectionLabel from "@/components/studio/SectionLabel";
import { revealStep } from "@/lib/motion";

const FIELD_CLASS =
  "w-full px-3.5 py-3 border border-white/10 bg-ink/70 text-white placeholder-white/30 text-base sm:text-sm transition-colors duration-200 hover:border-white/25 focus:border-signal/70 focus:bg-ink/90 focus:outline-none";
const LABEL_CLASS = "block font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 mb-2";
const STEP_CLASS = "flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 mb-3";

const PRICE_PER_HOUR = 40;
const MIN_HOURS = 1;
const MAX_HOURS = 6;
/** Use same-origin proxy to avoid CORS; proxy forwards to Google script when NEXT_PUBLIC_BOOKING_API_URL is set. */
const API_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL ? "/api/booking" : "";
const FALLBACK_IFRAME_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "";

type DayStatus = "available" | "busy" | "past";
type SlotStatus = "available" | "busy" | "selected";

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const days: { date: Date; day: number; isCurrentMonth: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < totalCells; i++) {
    const cellIndex = i - startPad;
    if (cellIndex < 0) {
      const d = new Date(year, month, cellIndex + 1);
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false });
    } else if (cellIndex < daysInMonth) {
      const d = new Date(year, month, cellIndex + 1);
      days.push({ date: d, day: d.getDate(), isCurrentMonth: true });
    } else {
      const d = new Date(year, month, cellIndex + 1);
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false });
    }
  }
  return days;
}

function dateKey(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** Format 24h slot "HH:MM" as 12h with AM/PM (e.g. "18:00" -> "6:00 PM"). */
function formatSlot12h(slot: string): string {
  const match = slot.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return slot;
  let hour = parseInt(match[1], 10);
  const min = match[2];
  const ampm = hour < 12 ? "AM" : "PM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${min} ${ampm}`;
}

function generateMockAvailability(year: number, month: number): Record<string, { status: DayStatus; slots: string[] }> {
  const out: Record<string, { status: DayStatus; slots: string[] }> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slots = Array.from({ length: 14 }, (_, i) => `${10 + i}:00`); // 10:00 – 23:00 (11 PM)

  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) continue;
    if (d < today) {
      out[dateKey(d)] = { status: "past", slots: [] };
      continue;
    }
    out[dateKey(d)] = { status: "available", slots };
  }
  return out;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

export default function Booking() {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [availability, setAvailability] = useState<Record<string, { status: DayStatus; slots: string[] }>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    instagram: "",
    notes: "",
  });
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successLine, setSuccessLine] = useState("");
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const loadAvailability = useCallback(async (year: number, month: number) => {
    if (API_URL) {
      setAvailabilityError(null);
      try {
        const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
        const res = await fetch(`/api/booking?month=${monthStr}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && (data.dates || data.availability)) {
          setAvailability(data.dates || data.availability);
          return;
        }
        const errMsg = typeof data?.error === "string" ? data.error : `Failed to load (${res.status})`;
        setAvailabilityError(errMsg);
        setAvailability({});
      } catch {
        setAvailabilityError("Could not reach calendar. Check the console.");
        setAvailability({});
      }
      return;
    }
    setAvailabilityError(null);
    setAvailability(generateMockAvailability(year, month));
  }, []);

  useEffect(() => {
    loadAvailability(viewDate.year, viewDate.month);
  }, [viewDate.year, viewDate.month, loadAvailability]);

  const days = useMemo(
    () => getMonthDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  );

  const monthAvailability = useMemo(() => {
    const key = viewDate.year + "-" + String(viewDate.month + 1).padStart(2, "0");
    return days.reduce<Record<string, { status: DayStatus; slots: string[] }>>((acc, { date, isCurrentMonth }) => {
      const k = dateKey(date);
      if (isCurrentMonth && availability[k]) acc[k] = availability[k];
      else if (isCurrentMonth) acc[k] = { status: "available", slots: Array.from({ length: 14 }, (_, i) => `${10 + i}:00`) };
      return acc;
    }, {});
  }, [days, availability, viewDate]);

  const selectedDateKey = selectedDate ? dateKey(selectedDate) : null;
  const slotsForDay = selectedDateKey ? (monthAvailability[selectedDateKey]?.slots || []) : [];
  const todayKey = dateKey(new Date());
  const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const isSlotPast = (slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    return (h * 60 + (m || 0)) <= currentMinutes;
  };
  const slotsForDayFiltered =
    selectedDateKey === todayKey ? slotsForDay.filter((s) => !isSlotPast(s)) : slotsForDay;
  const selectedSlotsOrdered = selectedStart && selectedEnd
    ? [selectedStart, selectedEnd].sort()
    : [];

  const hours = selectedStart && selectedEnd
    ? (() => {
        const [s, e] = [selectedStart, selectedEnd].sort();
        const si = slotsForDay.indexOf(s);
        const ei = slotsForDay.indexOf(e);
        return ei - si;
      })()
    : 0;
  const quote = hours * PRICE_PER_HOUR;
  const validRange = selectedStart && selectedEnd && hours >= MIN_HOURS && hours <= MAX_HOURS;

  const getSlotStatus = (slot: string): SlotStatus => {
    if (!selectedDateKey) return "available";
    if (selectedSlotsOrdered[0] === slot || selectedSlotsOrdered[1] === slot) return "selected";
    return "available";
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleDayClick = (d: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    const k = dateKey(d);
    const info = monthAvailability[k];
    if (!info || info.status === "past" || info.status === "busy") return;
    setSelectedDate(d);
    setSelectedHours(null);
    setSelectedStart(null);
    setSelectedEnd(null);
  };

  const handleSlotClick = (slot: string) => {
    const si = slotsForDay.indexOf(slot);

    if (selectedHours !== null) {
      const endIndex = si + selectedHours;
      if (endIndex <= slotsForDay.length) {
        setSelectedStart(slot);
        setSelectedEnd(slotsForDay[endIndex]);
      }
      return;
    }

    if (!selectedStart) {
      setSelectedStart(slot);
      setSelectedEnd(null);
      return;
    }
    if (selectedStart === slot) {
      setSelectedStart(null);
      setSelectedEnd(null);
      return;
    }
    if (selectedEnd === slot) {
      setSelectedEnd(null);
      return;
    }
    const [s, e] = [selectedStart, slot].sort();
    const ei = slotsForDay.indexOf(slot);
    const len = ei - slotsForDay.indexOf(s);
    if (len > MAX_HOURS) {
      setSubmitMessage(`Maximum booking is ${MAX_HOURS} hours.`);
      return;
    }
    if (len >= MIN_HOURS) {
      setSelectedEnd(slot);
      setSubmitMessage("");
    } else {
      setSelectedStart(slot);
      setSelectedEnd(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedStart || !selectedEnd || hours < MIN_HOURS || hours > MAX_HOURS || !agree) return;
    if (selectedDateKey === todayKey && (isSlotPast(selectedStart) || isSlotPast(selectedEnd))) {
      setSubmitMessage("That time has passed. Please pick a current or future slot.");
      return;
    }
    setSubmitting(true);
    setSubmitMessage("");

    if (!API_URL) {
      setSubmitMessage("Booking API not configured. Set NEXT_PUBLIC_BOOKING_API_URL to send requests.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          instagram: form.instagram,
          date: selectedDateKey,
          startTime: selectedStart,
          endTime: selectedEnd,
          notes: form.notes,
          hours,
          quote,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
        setSubmitMessage(errMsg);
        setSubmitting(false);
        return;
      }
      setSuccessLine(`${selectedDateKey} · ${formatSlot12h(selectedStart)} – ${formatSlot12h(selectedEnd)} · $${quote}`);
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error && err.message === "Failed to fetch"
        ? "Request blocked (often CORS). Deploy the Google script as “Anyone” can access and redeploy."
        : "Something went wrong. Try again or contact directly.";
      setSubmitMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSelectedDate(null);
    setSelectedHours(null);
    setSelectedStart(null);
    setSelectedEnd(null);
    setSubmitted(false);
    setSuccessLine("");
    setSubmitMessage("");
  };

  const hoursStepRef = useRef<HTMLDivElement>(null);
  const slotsStepRef = useRef<HTMLParagraphElement>(null);
  const detailsStepRef = useRef<HTMLFormElement>(null);
  const rangeComplete = Boolean(selectedStart && selectedEnd);

  useEffect(() => {
    if (selectedDate) return revealStep(hoursStepRef.current);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedHours !== null) return revealStep(slotsStepRef.current);
  }, [selectedHours]);

  useEffect(() => {
    if (rangeComplete) return revealStep(detailsStepRef.current);
  }, [rangeComplete]);

  if (FALLBACK_IFRAME_URL && !API_URL) {
    return (
      <section id="book" tabIndex={-1} className="pt-10 pb-20 md:pt-14 md:pb-28 scroll-mt-20 focus:outline-none">
        <div className="w-full max-w-6xl mx-auto">
          <div className="mb-10">
            <SectionLabel index="01" label="Book" meta="Live availability" />
            <h2 className="display mt-6 text-[clamp(2.25rem,6vw,4rem)] font-[800] uppercase leading-[0.9] text-white">Available Times</h2>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">Select a date and time below.</p>
          </div>
          <div className="panel ticks min-h-[800px]">
            <iframe
              src={FALLBACK_IFRAME_URL}
              className="w-full min-h-[800px] border-0 block"
              title="Book a session"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="book" tabIndex={-1} className="pt-10 pb-20 md:pt-14 md:pb-28 scroll-mt-20 focus:outline-none">
      <div className="w-full max-w-2xl lg:max-w-none mx-auto">
        <div className="mb-10">
          <SectionLabel index="01" label="Book" meta="Live availability" />
          <Reveal>
            <h2 className="display mt-6 text-[clamp(2.25rem,6vw,4rem)] font-[800] uppercase leading-[0.9] text-white">Available Times</h2>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">Select a date and time below.</p>
          </Reveal>
          {availabilityError && (
            <p className="mt-4 border-l border-signal/70 pl-3 font-mono text-[11px] leading-relaxed text-signal/90">
              {availabilityError} — Calendar may be showing sample times. Redeploy the Google script and restart the dev server.
            </p>
          )}
        </div>

        {submitted ? (
          <div className="panel ticks fade-in p-6 sm:p-8">
            <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
              <span className="grid h-5 w-5 place-items-center border border-signal/70 text-[10px]">✓</span>
              Status / Sent
            </p>
            <h3 className="display mt-5 text-3xl font-[800] uppercase leading-none text-white sm:text-4xl">Request received</h3>
            <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.12em] text-white/75">{successLine}</p>
            <p className="mt-2 text-sm text-white/55">We’ll contact you to confirm.</p>
            <button
              type="button"
              onClick={resetBooking}
              className="btn-line group mt-7"
            >
              <span className="link-u">Book another session</span>
              <span aria-hidden>↺</span>
            </button>
          </div>
        ) : (
          <>
            <div className="panel ticks mb-8">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3 sm:px-5">
                <div className="flex items-baseline gap-3">
                  <span className="hidden font-mono text-[10px] tracking-[0.2em] text-white/35 sm:inline">CAL</span>
                  <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-white">
                    {MONTHS[viewDate.month]} {viewDate.year}
                  </span>
                </div>
                <div className="flex">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="group flex h-9 items-center gap-2 border border-white/15 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/45 hover:text-white"
                  >
                    <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="group -ml-px flex h-9 items-center gap-2 border border-white/15 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-white/45 hover:text-white"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-5">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEKDAYS.map((w) => (
                    <div key={w} className="pb-2 pt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 sm:text-[10px]">
                      {w}
                    </div>
                  ))}
                  {days.map(({ date, day, isCurrentMonth }) => {
                    const k = dateKey(date);
                    const info = monthAvailability[k];
                    const status = info?.status ?? "available";
                    const isPast = status === "past";
                    const isBusy = status === "busy";
                    const isSelected = selectedDateKey === k;
                    const clickable = isCurrentMonth && !isPast && !isBusy;
                    const isToday = isCurrentMonth && k === todayKey;
                    const tone = isSelected
                      ? "bg-signal text-black shadow-[0_0_28px_-6px_rgba(255,138,61,0.75)]"
                      : !isCurrentMonth
                        ? "text-white/[0.14]"
                        : isBusy
                          ? "hatch text-white/25 line-through decoration-white/20 cursor-not-allowed"
                          : isPast
                            ? "text-white/25 cursor-not-allowed"
                            : "text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] hover:bg-white/[0.07] hover:text-white hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]";
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={!clickable}
                        onClick={() => handleDayClick(date, isCurrentMonth)}
                        className={`relative aspect-square lg:aspect-[3/2] font-mono text-[13px] tabular-nums transition-[background-color,color,box-shadow] duration-200 sm:text-sm ${tone}`}
                      >
                        {day}
                        {isToday && (
                          <span
                            aria-hidden
                            className={`absolute bottom-[18%] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full ${isSelected ? "bg-black" : "bg-signal"}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 sm:px-5 sm:text-[10px]">
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]" /> Open</span>
                <span className="flex items-center gap-2"><span className="hatch h-2.5 w-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" /> Unavailable</span>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 bg-signal" /> Selected</span>
                <span className="flex items-center gap-2"><span className="h-[3px] w-[3px] rounded-full bg-signal" /> Today</span>
              </div>
            </div>

            {selectedDate && (
              <>
                <div ref={hoursStepRef} className="panel ticks fade-in mb-8 p-4 sm:p-5">
                  <p className={STEP_CLASS}>
                    <span className="text-signal">02</span>
                    <span>How many hours?</span>
                  </p>
                  <div className="mb-7 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                    {Array.from({ length: MAX_HOURS }, (_, i) => i + 1).filter((h) => h <= slotsForDayFiltered.length).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setSelectedHours(h);
                          setSelectedStart(null);
                          setSelectedEnd(null);
                        }}
                        className={`h-11 border font-mono text-[12px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                          selectedHours === h
                            ? "border-signal bg-signal text-black"
                            : "border-white/[0.12] text-white/75 hover:border-white/40 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {h} hr{h > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  <p ref={slotsStepRef} className={STEP_CLASS}>
                    <span className="text-signal">03</span>
                    <span>Time slots · {selectedDateKey}</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
                    {slotsForDayFiltered.map((slot) => {
                      const status = getSlotStatus(slot);
                      const idx = slotsForDay.indexOf(slot);
                      const inRange =
                        selectedSlotsOrdered.length === 2 &&
                        idx > slotsForDay.indexOf(selectedSlotsOrdered[0]) &&
                        idx < slotsForDay.indexOf(selectedSlotsOrdered[1]);
                      const pending = !selectedEnd && selectedStart === slot;
                      const edge =
                        status === "selected" ? (slot === selectedSlotsOrdered[0] ? "In" : "Out") : pending ? "In" : null;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotClick(slot)}
                          className={`relative h-11 border font-mono text-[12px] tabular-nums tracking-[0.04em] transition-colors duration-200 ${
                            status === "selected"
                              ? "border-signal bg-signal text-black"
                              : pending
                                ? "border-signal/80 bg-signal/10 text-white"
                                : inRange
                                  ? "border-signal/30 bg-signal/[0.12] text-white"
                                  : "border-white/[0.12] text-white/75 hover:border-white/40 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          {formatSlot12h(slot)}
                          {edge && (
                            <span
                              aria-hidden
                              className={`absolute right-1 top-0.5 text-[8px] uppercase tracking-[0.16em] ${status === "selected" ? "text-black/60" : "text-signal"}`}
                            >
                              {edge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55" aria-live="polite">
                    <span aria-hidden className="text-signal">›</span>
                    {selectedStart && selectedEnd
                      ? `${hours} hr${hours > 1 ? "s" : ""} · $${quote}`
                      : selectedHours
                        ? "Select a start time."
                        : "Select start and end, or pick hours above first."}
                  </p>
                </div>

                <form ref={detailsStepRef} onSubmit={handleSubmit} className="space-y-5 fade-in">
                  <p className={STEP_CLASS}>
                    <span className="text-signal">04</span>
                    <span>Your details</span>
                    <span aria-hidden className="h-px flex-1 bg-white/10" />
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bkFirst" className={LABEL_CLASS}>First name</label>
                      <input
                        id="bkFirst"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className={FIELD_CLASS}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label htmlFor="bkLast" className={LABEL_CLASS}>Last name</label>
                      <input
                        id="bkLast"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className={FIELD_CLASS}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bkEmail" className={LABEL_CLASS}>Email</label>
                    <input
                      id="bkEmail"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className={FIELD_CLASS}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bkPhone" className={LABEL_CLASS}>Phone</label>
                      <input
                        id="bkPhone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className={FIELD_CLASS}
                        placeholder="Phone"
                      />
                    </div>
                    <div>
                      <label htmlFor="bkIg" className={LABEL_CLASS}>Instagram</label>
                      <input
                        id="bkIg"
                        type="text"
                        required
                        placeholder="@handle"
                        value={form.instagram}
                        onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bkNotes" className={LABEL_CLASS}>About</label>
                    <textarea
                      id="bkNotes"
                      rows={3}
                      placeholder="What you want to work on, references, any details"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className={`${FIELD_CLASS} resize-none`}
                    />
                  </div>
                  <div className="panel ticks p-4 text-xs text-white/70 sm:p-5">
                    <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-white/[0.08] pb-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Session rules</p>
                      <p className="font-mono text-[13px] tracking-[0.08em] text-white">${PRICE_PER_HOUR}/hr</p>
                    </div>
                    <ul className="space-y-1.5 text-[13px] leading-relaxed text-white/55">
                      <li className="flex gap-3"><span aria-hidden className="font-mono text-white/30">—</span>Arrive on time (late time still counts)</li>
                      <li className="flex gap-3"><span aria-hidden className="font-mono text-white/30">—</span>You’re responsible for the full amount at the end of your session</li>
                      <li className="flex gap-3"><span aria-hidden className="font-mono text-white/30">—</span>Be ready (references, beats, lyrics)</li>
                    </ul>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-white/[0.08] pt-4 text-[13px] text-white/80">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="check"
                      />
                      <span>I understand the rules and want to request this session.</span>
                    </label>
                  </div>
                  {validRange && (
                    <p className="fade-in flex items-baseline font-mono text-[12px] uppercase tracking-[0.14em] text-white/60">
                      <span>Quote</span>
                      <span aria-hidden className="leader" />
                      <span>
                        <strong className="text-[15px] font-medium text-signal">${quote}</strong>{" "}
                        <span className="text-white/45">({hours} hr{hours > 1 ? "s" : ""})</span>
                      </span>
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!validRange || !agree || submitting}
                    className="btn-signal group w-full justify-between py-5"
                  >
                    <span>{submitting ? "Sending…" : "Request booking"}</span>
                    {submitting ? (
                      <span aria-hidden className="blink">●</span>
                    ) : (
                      <span className="arrow-swap" aria-hidden>
                        <span>→</span>
                        <span>→</span>
                      </span>
                    )}
                  </button>
                  {submitMessage && (
                    <p className="border-l border-signal/60 pl-3 font-mono text-[11px] uppercase leading-relaxed tracking-[0.1em] text-white/70" role="status">
                      {submitMessage}
                    </p>
                  )}
                </form>
              </>
            )}

            {!selectedDate && (
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-white/50">
                <span aria-hidden className="text-signal">›</span>
                Select a date above to see times and request a booking.
                <span aria-hidden className="blink inline-block h-3 w-1.5 bg-white/60" />
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
