// app/checkout/success/page.tsx
import React from "react";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

type SearchParams = { [key: string]: string | string[] | undefined };

// Format a date in a specific IANA timezone
function formatInTZ(dt: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    dateStyle: "full",
    timeStyle: "short",
  }).format(dt);
}

// Google Calendar expects UTC like 20251102T183000Z
function toGoogleUTC(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const HH = pad(d.getUTCHours());
  const MM = pad(d.getUTCMinutes());
  const SS = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${HH}${MM}${SS}Z`;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const bookingId =
    (typeof searchParams.bookingId === "string" && searchParams.bookingId) ||
    (typeof searchParams.id === "string" && searchParams.id) ||
    "";

  if (!bookingId) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Payment Success</h1>
        <p className="text-gray-600">
          Thanks! If you reached this page directly, please return to your
          account to view booking details.
        </p>
      </main>
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { reader: true },
  });

  if (!booking) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">We couldn’t find that booking</h1>
        <p className="text-gray-600">
          Double-check your link or return to your dashboard.
        </p>
      </main>
    );
  }

  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);

  const actorTZ = booking.actorTimezone || "UTC";
  const readerName = booking.reader?.displayName ?? "your reader";

  // Personality line + details
  const headline = "Congrats on your audition!! 🎬✨";
  const localStart = formatInTZ(start, actorTZ);
  const tzLabel = actorTZ; // keep IANA label (more accurate than abbreviations)
  const zoomLink = booking.meetingUrl || "Meeting link coming soon (we’ll email it!)";

  // Calendar links
  const title = `Self-Tape Session with ${readerName}`;
  const details =
    `You’re booked with ${readerName}!` +
    (booking.meetingUrl ? `\n\nZoom: ${booking.meetingUrl}` : "");
  const location = booking.meetingUrl || "Online";

  const gCalUrl = new URL("https://calendar.google.com/calendar/render");
  gCalUrl.searchParams.set("action", "TEMPLATE");
  gCalUrl.searchParams.set("text", title);
  gCalUrl.searchParams.set("details", details);
  gCalUrl.searchParams.set("location", location);
  gCalUrl.searchParams.set("dates", `${toGoogleUTC(start)}/${toGoogleUTC(end)}`);

  const icsUrl = `/api/ics/booking?bookingId=${booking.id}`; // (we'll add this route next)

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="rounded-2xl p-6 shadow-md border">
        <h1 className="text-3xl font-extrabold mb-2">{headline}</h1>
        <p className="text-gray-700 mb-6">
          You booked <span className="font-semibold">{readerName}</span> as your reader.
        </p>

        <div className="grid gap-3 mb-6">
          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500">Date & Time</div>
            <div className="text-lg">
              {localStart} <span className="text-gray-500">({tzLabel})</span>
            </div>
          </div>

          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500">Zoom Link</div>
            {booking.meetingUrl ? (
              <a
                href={booking.meetingUrl}
                className="text-blue-600 underline break-all"
                target="_blank"
                rel="noopener noreferrer"
              >
                {booking.meetingUrl}
              </a>
            ) : (
              <div className="text-gray-700">{zoomLink}</div>
            )}
          </div>

          <div>
            <div className="text-sm uppercase tracking-wide text-gray-500">Booking ID</div>
            <div className="font-mono text-sm">{booking.id}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={gCalUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl shadow bg-black text-white"
          >
            Add to Google Calendar
          </a>
          <a
            href={icsUrl}
            className="px-4 py-2 rounded-xl shadow border"
          >
            Download .ICS (Apple/Outlook)
          </a>
        </div>

        <p className="mt-6 text-gray-600">
          We just sent a confirmation email with all the details. Break a leg! 🍀
        </p>
      </div>
    </main>
  );
}
