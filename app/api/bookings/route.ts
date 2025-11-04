// app/api/bookings/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

// ESM-safe Prisma import
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BookingRequest = {
  readerId: string;
  actorName?: string;
  actorEmail?: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  actorTimezone?: string; // IANA TZ like "America/Los_Angeles"
};

// ---- helpers ----
const toDate = (iso: string) => new Date(iso);
const minutesBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 60000);

function isValidIanaTZ(tz?: string): tz is string {
  if (!tz) return false;
  try {
    // Throws if tz is not a valid IANA name
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<BookingRequest>;
    const { readerId, actorName, actorEmail, startTime, endTime, actorTimezone } = body ?? {};

    if (!readerId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing readerId/startTime/endTime" },
        { status: 400 }
      );
    }

    const start = toDate(startTime);
    const end = toDate(endTime);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return NextResponse.json({ error: "Invalid start/end time" }, { status: 400 });
    }

    // 1) Load reader with rates + Connect id
    const reader = await prisma.reader.findUnique({
      where: { id: readerId },
      select: {
        id: true,
        displayName: true,
        stripeAccountId: true,
        ratePer15Min: true,
        ratePer30Min: true,
        ratePer60Min: true,
      },
    });
    if (!reader) return NextResponse.json({ error: "Reader not found" }, { status: 404 });
    if (!reader.stripeAccountId) {
      return NextResponse.json(
        { error: "Reader not onboarded for payouts yet" },
        { status: 400 }
      );
    }

    // 2) Duration + price
    const durationMin = minutesBetween(start, end);
    let priceCents: number | null = null;
    if (durationMin === 15) priceCents = reader.ratePer15Min ?? 1500;
    if (durationMin === 30) priceCents = reader.ratePer30Min ?? 2500;
    if (durationMin === 60) priceCents = reader.ratePer60Min ?? 6000;
    if (!priceCents) {
      return NextResponse.json(
        { error: "Unsupported duration. Use 15, 30, or 60 minutes." },
        { status: 400 }
      );
    }

    // 3) Overlap check (PENDING or PAID = taken)
    const conflict = await prisma.booking.findFirst({
      where: {
        readerId,
        status: { in: ["PENDING", "PAID"] },
        // overlap: existing.start < new.end && existing.end > new.start
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Reader already booked for that time." },
        { status: 400 }
      );
    }

    // 4) Capture actor timezone (from client) with safe fallback
    const tz = isValidIanaTZ(actorTimezone) ? actorTimezone : "UTC";

    // 5) Create booking record (PENDING)
    const created = await prisma.booking.create({
      data: {
        actorName: actorName ?? "",
        actorEmail: actorEmail ?? "",
        actorTimezone: tz,              // âœ… store actorâ€™s timezone
        readerId,
        startTime: start,
        endTime: end,
        durationMin,
        priceCents,
        status: "PENDING",
      },
      select: { id: true },
    });

    // 6) Stripe Checkout with 80/20 split via Connect
    const secret = process.env.STRIPE_SECRET_KEY || "";
    if (!secret) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const stripe = new Stripe(secret);

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const feeCents = Math.round(priceCents * 0.2); // platform 20%

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_intent_data: {
        application_fee_amount: feeCents,
        transfer_data: {
          destination: reader.stripeAccountId!, // readerâ€™s Connect acct
        },
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Session with ${reader.displayName}` },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: created.id,
        readerId,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?bookingId=${created.id}`,
    });

    return NextResponse.json({ url: session.url, bookingId: created.id });
  } catch (err: any) {
    console.error("Booking creation failed:", err?.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

