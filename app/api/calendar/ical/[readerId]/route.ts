// app/api/calendar/ical/[readerId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Format a Date to ICS UTC like 20251108T150000Z */
function icsDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getUTCFullYear();
  const mon = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const m = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${year}${mon}${day}T${h}${m}${s}Z`;
}

/** Escape text per RFC5545 */
function icsEscape(s: string) {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ readerId: string }> } // Next 16 can pass params as a Promise
) {
  const { readerId } = await ctx.params;
  const id = (readerId || "").trim();

  if (!id) {
    return new NextResponse("Missing readerId", { status: 400 });
  }

  // Load reader (for calendar name) and bookings
  const reader = await prisma.reader.findUnique({
    where: { id },
    select: { id: true, displayName: true, email: true },
  });

  if (!reader) {
    return new NextResponse("Reader not found", { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { readerId: id },
    orderBy: { startTime: "asc" },
    take: 500, // safety cap
  });

  const now = new Date();

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Reader Marketplace//Calendar Feed//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push(`X-WR-CALNAME:${icsEscape(reader.displayName || reader.email || "Reader Bookings")}`);
  lines.push("METHOD:PUBLISH");

  for (const b of bookings) {
    const uid = `${b.id}@reader-marketplace`;
    const dtstart = icsDate(new Date(b.startTime));
    const dtend = icsDate(new Date(b.endTime));
    const created = icsDate(new Date(b.createdAt));
    const updated = icsDate(new Date(b.updatedAt));

    const summary = `Self-Tape Session with ${b.actorName}`;
    const status = b.status === "CANCELED" ? "CANCELLED" : "CONFIRMED";
    const descParts = [
      `Actor: ${b.actorName} <${b.actorEmail}>`,
      `Status: ${b.status}`,
      b.meetingUrl ? `Meeting: ${b.meetingUrl}` : "",
      b.notes ? `Notes: ${b.notes}` : "",
    ].filter(Boolean);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${icsDate(now)}`);
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`CREATED:${created}`);
    lines.push(`LAST-MODIFIED:${updated}`);
    lines.push(`SUMMARY:${icsEscape(summary)}`);
    lines.push(`DESCRIPTION:${icsEscape(descParts.join("\n"))}`);
    lines.push(`STATUS:${status}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  const icsBody = lines.join("\r\n");

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="reader-${reader.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
