"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

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

  if (FALLBACK_IFRAME_URL && !API_URL) {
    return (
      <section id="book" className="pt-10 pb-20 md:pt-14 md:pb-28 scroll-mt-20">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-medium text-white tracking-tight">Available Times</h2>
            <p className="text-white/60 text-sm mt-1">Select a date and time below.</p>
          </div>
          <div className="min-h-[800px]">
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
    <section id="book" className="pt-10 pb-20 md:pt-14 md:pb-28 scroll-mt-20">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h2 className="text-3xl font-medium text-white tracking-tight">Available Times</h2>
          <p className="text-white/70 text-sm mt-1">Select a date and time below.</p>
          {availabilityError && (
            <p className="mt-3 text-amber-300/90 text-sm">
              {availabilityError} — Calendar may be showing sample times. Redeploy the Google script and restart the dev server.
            </p>
          )}
        </div>

        {submitted ? (
          <div className="rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm p-6">
            <h3 className="text-xl font-medium text-white">Request received</h3>
            <p className="text-white/60 text-sm mt-1">{successLine}</p>
            <p className="text-white/50 text-sm mt-2">We’ll contact you to confirm.</p>
            <button
              type="button"
              onClick={resetBooking}
              className="mt-4 px-6 py-3 text-sm font-medium text-[#111] bg-[#e8e8e8] rounded-lg hover:bg-white/90 transition-colors"
            >
              Book another session
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm p-4 mb-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-sm font-medium text-white/80 uppercase tracking-wider">
                  {MONTHS[viewDate.month]} {viewDate.year}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white border border-white/20 rounded-md transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white border border-white/20 rounded-md transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-[10px] text-white/50 uppercase py-1">
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
                  return (
                    <button
                      key={k}
                      type="button"
                      disabled={!clickable}
                      onClick={() => handleDayClick(date, isCurrentMonth)}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-colors
                        ${!isCurrentMonth ? "text-white/30" : ""}
                        ${isCurrentMonth && isPast ? "text-white/40 cursor-not-allowed" : ""}
                        ${isCurrentMonth && isBusy ? "text-white/40 cursor-not-allowed" : ""}
                        ${isCurrentMonth && status === "available" ? "text-white hover:bg-white/10" : ""}
                        ${isSelected ? "ring-2 ring-white/60 bg-white/15 text-white" : ""}
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <>
                <div className="mb-4">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">How many hours?</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Array.from({ length: MAX_HOURS }, (_, i) => i + 1).filter((h) => h <= slotsForDayFiltered.length).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setSelectedHours(h);
                          setSelectedStart(null);
                          setSelectedEnd(null);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          selectedHours === h
                            ? "bg-white/20 border-white/50 text-white"
                            : "border-white/20 text-white/80 hover:border-white/40 hover:bg-white/10"
                        }`}
                      >
                        {h} hr{h > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Time slots · {selectedDateKey}</p>
                  <div className="flex flex-wrap gap-2">
                    {slotsForDayFiltered.map((slot) => {
                      const status = getSlotStatus(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotClick(slot)}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                            ${status === "selected" ? "bg-white/20 border-white/50 text-white" : "border-white/20 text-white/80 hover:border-white/40 hover:bg-white/10"}
                          `}
                        >
                          {formatSlot12h(slot)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-white/50 text-xs mt-2">
                    {selectedStart && selectedEnd
                      ? `${hours} hr${hours > 1 ? "s" : ""} · $${quote}`
                      : selectedHours
                        ? "Select a start time."
                        : "Select start and end, or pick hours above first."}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bkFirst" className="block text-xs text-white/60 mb-1">First name</label>
                      <input
                        id="bkFirst"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-white/50 text-sm focus:border-white/40 focus:outline-none"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label htmlFor="bkLast" className="block text-xs text-white/60 mb-1">Last name</label>
                      <input
                        id="bkLast"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-white/50 text-sm focus:border-white/40 focus:outline-none"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bkEmail" className="block text-xs text-white/60 mb-1">Email</label>
                    <input
                      id="bkEmail"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-white/50 text-sm focus:border-white/40 focus:outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bkPhone" className="block text-xs text-white/60 mb-1">Phone</label>
                      <input
                        id="bkPhone"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-white/50 text-sm focus:border-white/40 focus:outline-none"
                        placeholder="Phone"
                      />
                    </div>
                    <div>
                      <label htmlFor="bkIg" className="block text-xs text-white/60 mb-1">Instagram</label>
                      <input
                        id="bkIg"
                        type="text"
                        required
                        placeholder="@handle"
                        value={form.instagram}
                        onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-white/50 text-sm focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bkNotes" className="block text-xs text-white/60 mb-1">About</label>
                    <textarea
                      id="bkNotes"
                      rows={3}
                      placeholder="What you want to work on, references, any details"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm text-white placeholder-white/50 text-sm focus:border-white/40 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="rounded-lg border border-white/20 bg-black/30 backdrop-blur-sm p-3 text-xs text-white/70">
                    <p className="font-medium text-white/80 mb-1">${PRICE_PER_HOUR}/hr</p>
                    <ul className="list-disc list-inside space-y-0.5 text-white/50">
                      <li>Arrive on time (late time still counts)</li>
                      <li>You’re responsible for the full amount at the end of your session</li>
                      <li>Be ready (references, beats, lyrics)</li>
                    </ul>
                    <label className="mt-3 flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className="mt-1 rounded border-white/30 bg-black/30 text-white focus:ring-white/40"
                      />
                      <span>I understand the rules and want to request this session.</span>
                    </label>
                  </div>
                  {validRange && (
                    <p className="text-sm text-white/70">
                      Quote: <strong className="text-white">${quote}</strong> ({hours} hr{hours > 1 ? "s" : ""})
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!validRange || !agree || submitting}
                    className="w-full px-6 py-4 text-sm font-medium text-[#111] bg-[#e8e8e8] rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Sending…" : "Request booking"}
                  </button>
                  {submitMessage && <p className="text-sm text-white/60" role="status">{submitMessage}</p>}
                </form>
              </>
            )}

            {!selectedDate && (
              <p className="text-white/50 text-sm">Select a date above to see times and request a booking.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
