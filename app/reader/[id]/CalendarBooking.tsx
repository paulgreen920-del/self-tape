"use client";
type AvailabilitySlot = {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
};
import { useState, useEffect } from "react";

type TimeSlot = {
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
};

type Reader = {
  id: string;
  displayName: string;
  ratePer15Min: number;
  ratePer30Min: number;
  ratePer60Min: number;
  maxAdvanceBooking: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarBooking({ 
  reader,
  availability 
}: { 
  reader: Reader;
  availability: AvailabilitySlot[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [duration, setDuration] = useState<15 | 30 | 60>(30);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actorName, setActorName] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  // Get days in current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<Date | null> = [];
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + reader.maxAdvanceBooking);

  const isDateAvailable = (date: Date | null) => {
    if (!date) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    // Must be within booking window
    if (compareDate < today || compareDate > maxDate) return false;
    
    // Check if this specific date has available slots
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return availableDays.includes(dateStr);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
  };

  const selectDate = async (date: Date | null) => {
    if (!date || !isDateAvailable(date)) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSelectedDate(dateStr);
    setLoadingSlots(true);

    try {
      const res = await fetch(
        `/api/schedule/available-slots?readerId=${reader.id}&date=${dateStr}&duration=${duration}`
      );
      const data = await res.json();
      
      if (data.ok) {
        setSlots(data.slots || []);
        
        // If no slots, unhighlight this day
        if (!data.slots || data.slots.length === 0) {
          setAvailableDays(prev => prev.filter(d => d !== dateStr));
          setSelectedDate(null); // ← ADDED THIS LINE
        }
      }
    } catch (err) {
      console.error("Failed to load slots:", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Reload slots when duration changes
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      selectDate(date);
    }
  }, [duration]);

  // Fetch available days when month or duration changes
  useEffect(() => {
    async function fetchAvailableDays() {
      try {
        const res = await fetch(
          `/api/schedule/available-days?readerId=${reader.id}&duration=${duration}`
        );
        const data = await res.json();
        if (data.ok) {
          setAvailableDays(data.availableDays || []);
        }
      } catch (err) {
        console.error("Failed to load available days:", err);
      }
    }
    fetchAvailableDays();
  }, [currentMonth, duration, reader.id]);

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const getPrice = () => {
    if (duration === 15) return reader.ratePer15Min;
    if (duration === 30) return reader.ratePer30Min;
    return reader.ratePer60Min;
  };

  const bookSlot = async (slot: TimeSlot) => {
    if (!actorName || !actorEmail) {
      alert("Please enter your name and email");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerId: reader.id,
          actorName,
          actorEmail,
          date: selectedDate,
          startMin: slot.startMin,
          durationMin: duration,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      alert(err.message || "Failed to book");
      setBookingLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h2 className="text-xl font-semibold mb-4">Book a Session</h2>

      {/* Actor Info */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Your Name"
          className="border rounded px-3 py-2 w-full"
          value={actorName}
          onChange={(e) => setActorName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Your Email"
          className="border rounded px-3 py-2 w-full"
          value={actorEmail}
          onChange={(e) => setActorEmail(e.target.value)}
        />
      </div>

      {/* Duration Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Session Duration</label>
        <div className="flex gap-2">
          {[15, 30, 60].map((d) => (
            <button
              key={d}
              type="button"
              className={`px-4 py-2 rounded border ${
                duration === d ? "bg-emerald-600 text-white" : "bg-white hover:bg-gray-50"
              }`}
              onClick={() => setDuration(d as 15 | 30 | 60)}
            >
              {d} min (${(getPrice() / 100).toFixed(0)})
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="px-3 py-1 border rounded hover:bg-gray-50"
            onClick={goToPreviousMonth}
          >
            ←
          </button>
          <h3 className="font-semibold">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            className="px-3 py-1 border rounded hover:bg-gray-50"
            onClick={goToNextMonth}
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
              {day}
            </div>
          ))}
          {days.map((date, idx) => {
            const available = isDateAvailable(date);
            const year = date?.getFullYear();
            const month = String((date?.getMonth() ?? 0) + 1).padStart(2, '0');
            const day = String(date?.getDate() ?? 0).padStart(2, '0');
            const dateStr = date ? `${year}-${month}-${day}` : '';
            const isSelected = date && selectedDate === dateStr;

            return (
              <button
                key={idx}
                type="button"
                className={`aspect-square rounded p-2 text-sm ${
                  !date
                    ? "invisible"
                    : isSelected
                    ? "bg-emerald-600 text-white font-semibold"
                    : available
                    ? "border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer font-medium"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200"
                }`}
                onClick={() => selectDate(date)}
                disabled={!date || !available}
              >
                {date?.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h3 className="font-semibold mb-3">
            Available Times - {selectedDate}
          </h3>
          {loadingSlots ? (
            <p className="text-sm text-gray-500">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No available times on this day</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="border rounded px-3 py-2 text-sm hover:bg-emerald-50 disabled:opacity-50"
                  onClick={() => bookSlot(slot)}
                  disabled={bookingLoading || !actorName || !actorEmail}
                >
                  {formatTime(slot.startMin)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}