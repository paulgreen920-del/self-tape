"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TimeSlot = {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
};

export default function AvailabilityForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const readerId = (searchParams.get("readerId") ?? searchParams.get("id") ?? "").trim();

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [saving, setSaving] = useState(false);

  function addSlot() {
    setSlots([...slots, { dayOfWeek: 1, startMin: 540, endMin: 1020 }]);
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, field: keyof TimeSlot, value: number) {
    setSlots(slots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)));
  }

  function minutesToTime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  async function saveAvailability() {
    if (!readerId) {
      alert("Missing readerId");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readerId, slots }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save availability");
      }

      alert("Availability saved! Next: Stripe Connect setup");
      router.push(`/onboarding/payment?readerId=${readerId}`);
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Set Your Availability</h1>
      <p className="text-sm text-gray-600 mb-6">
        Choose the days and times when actors can book sessions with you.
      </p>

      <div className="space-y-4">
        {slots.map((slot, i) => (
          <div key={i} className="border rounded-lg p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Day</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(i, "dayOfWeek", Number(e.target.value))}
                >
                  {DAYS.map((day, idx) => (
                    <option key={idx} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  className="border rounded px-3 py-2 w-full"
                  value={minutesToTime(slot.startMin)}
                  onChange={(e) => updateSlot(i, "startMin", timeToMinutes(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  className="border rounded px-3 py-2 w-full"
                  value={minutesToTime(slot.endMin)}
                  onChange={(e) => updateSlot(i, "endMin", timeToMinutes(e.target.value))}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  className="border rounded px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                  onClick={() => removeSlot(i)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 border rounded px-4 py-2 hover:bg-gray-50"
        onClick={addSlot}
      >
        + Add Time Slot
      </button>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          className="border rounded px-4 py-2"
          onClick={() => router.push(`/onboarding/schedule?readerId=${readerId}`)}
        >
          Back
        </button>
        <button
          type="button"
          className="bg-emerald-600 text-white rounded px-4 py-2 hover:bg-emerald-700 disabled:opacity-50"
          onClick={saveAvailability}
          disabled={saving || slots.length === 0}
        >
          {saving ? "Saving..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}