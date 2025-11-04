// app/onboarding/schedule/page.tsx
"use client";

import { useState } from "react";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Slot = { dayOfWeek: number; startMin: number; endMin: number };

export default function SchedulingPage() {
  const [email, setEmail] = useState(""); // identify the reader
  const [timezone, setTimezone] = useState("America/New_York");
  const [availability, setAvailability] = useState<Slot[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, startMin: 9 * 60, endMin: 17 * 60 }))
  );
  const [busy, setBusy] = useState(false);
  const [bookingPath, setBookingPath] = useState<string>("");

  function updateSlot(i: number, key: keyof Slot, val: number) {
    setAvailability((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  }

  // helpers: HH:MM <-> minutes
  const toMin = (v: string) => {
    const [h, m] = v.split(":").map((n) => parseInt(n, 10));
    return h * 60 + (m || 0);
  };
  const toHM = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  const canSave = /\S+@\S+\.\S+/.test(email);

  async function save() {
    if (!canSave) return alert("Please enter a valid email (same as page 1).");
    setBusy(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, timezone, availability }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save schedule");
      setBookingPath(data.bookingPath); // e.g., /book/ck...
      alert(`Saved! Your booking link: ${data.bookingPath}`);
    } catch (e: any) {
      alert(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold">Scheduling</h1>
      <p className="text-sm text-gray-600 mt-1">
        Set your timezone and weekly availability. We'll add a Calendly-style booking page + optional calendar sync next.
      </p>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-1">Email (same as page 1)</label>
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="paul@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-1">Timezone</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {[
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Asia/Tokyo",
          ].map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium">Weekly availability</p>
        {availability.map((slot, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-center">
            <div className="col-span-1 text-sm">{DAYS[slot.dayOfWeek]}</div>
            <div className="col-span-2">
              <label className="text-xs block">Start</label>
              <input
                type="time"
                className="border rounded px-3 py-2 w-full"
                value={toHM(slot.startMin)}
                onChange={(e) => updateSlot(i, "startMin", toMin(e.target.value))}
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs block">End</label>
              <input
                type="time"
                className="border rounded px-3 py-2 w-full"
                value={toHM(slot.endMin)}
                onChange={(e) => updateSlot(i, "endMin", toMin(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3 items-center">
        <a href="/onboarding/reader" className="border rounded px-4 py-2">Back</a>
        <button
          onClick={save}
          className="border rounded px-4 py-2 disabled:opacity-50"
          disabled={!canSave || busy}
        >
          {busy ? "Saving..." : "Save & Continue"}
        </button>
        {bookingPath && (
          <a
            href={bookingPath}
            className="text-blue-600 underline ml-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open booking link
          </a>
        )}
      </div>
    </div>
  );
}
