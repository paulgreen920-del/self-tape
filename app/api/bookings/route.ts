import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { readerId, actorName, actorEmail, date, startMin, durationMin } = body as {
      readerId: string;
      actorName: string;
      actorEmail: string;
      date: string; // YYYY-MM-DD
      startMin: number; // e.g., 540 for 9:00 AM
      durationMin: number; // 15, 30, or 60
    };

    if (!readerId || !actorName || !actorEmail || !date || startMin == null || !durationMin) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Get reader
    const reader = await prisma.reader.findUnique({
      where: { id: readerId },
      select: {
        id: true,
        displayName: true,
        email: true,
        ratePer15Min: true,
        ratePer30Min: true,
        ratePer60Min: true,
        stripeAccountId: true,
      },
    });

    if (!reader) {
      return NextResponse.json({ ok: false, error: "Reader not found" }, { status: 404 });
    }

    if (!reader.stripeAccountId) {
      return NextResponse.json(
        { ok: false, error: "Reader hasn't set up payments yet" },
        { status: 400 }
      );
    }

    // Calculate price
    let priceCents: number;
    if (durationMin === 15) priceCents = reader.ratePer15Min;
    else if (durationMin === 30) priceCents = reader.ratePer30Min;
    else if (durationMin === 60) priceCents = reader.ratePer60Min;
    else {
      return NextResponse.json({ ok: false, error: "Invalid duration" }, { status: 400 });
    }

    // Build start and end times (UTC)
    const startTime = new Date(`${date}T${minutesToTime(startMin)}:00Z`);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    // Check for existing booking (deduplication)
    const existing = await prisma.booking.findFirst({
      where: {
        readerId,
        actorEmail,
        startTime,
        endTime,
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: true, booking: existing, message: "Booking already exists" },
        { status: 200 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        readerId,
        actorName,
        actorEmail,
        actorTimezone: "UTC",
        startTime,
        endTime,
        durationMin,
        priceCents,
        status: "PENDING",
      },
    });

    // Create Daily.co meeting room
    console.log("[bookings] About to create Daily.co room for booking:", booking.id);
    let meetingUrl = null;
    try {
      const roomApiUrl = `${process.env.NEXT_PUBLIC_URL}/api/daily/create-room`;
      console.log("[bookings] Calling Daily.co API at:", roomApiUrl);
      
      const roomRes = await fetch(roomApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          readerName: reader.displayName,
          actorName,
        }),
      });
      
      console.log("[bookings] Daily.co API response status:", roomRes.status);
      const roomData = await roomRes.json();
      console.log("[bookings] Daily.co API response:", roomData);
      
      if (roomData.ok && roomData.roomUrl) {
        meetingUrl = roomData.roomUrl;
        console.log("[bookings] Got meeting URL:", meetingUrl);
        // Update booking with meeting URL
        await prisma.booking.update({
          where: { id: booking.id },
          data: { meetingUrl },
        });
        console.log("[bookings] Updated booking with meeting URL");
      } else {
        console.error("[bookings] Failed to get room URL from Daily.co:", roomData);
      }
    } catch (err) {
      console.error("[bookings] Failed to create Daily.co room:", err);
  
      // Continue anyway - we can add the room later
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${durationMin}-minute session with ${reader.displayName}`,
              description: `${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?bookingId=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/reader/${readerId}`,
      customer_email: actorEmail,
      metadata: {
        bookingId: booking.id,
        readerId: reader.id,
      },
      // payment_intent_data: {
      //   application_fee_amount: Math.round(priceCents * 0.1), // 10% platform fee
      //   transfer_data: {
      //     destination: reader.stripeAccountId,
      //   },
      // },
    });
console.log("[bookings] Stripe session created:", session.id);
    console.log("[bookings] Checkout URL:", session.url);
    return NextResponse.json({ ok: true, bookingId: booking.id, checkoutUrl: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("[bookings] Error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to create booking" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const readerId = searchParams.get("readerId");
    const scope = searchParams.get("scope") ?? "future";

    if (!readerId) {
      return NextResponse.json({ ok: false, error: "Missing readerId" }, { status: 400 });
    }

    const now = new Date();
    const where = scope === "all" ? { readerId } : { readerId, startTime: { gte: now } };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        actorName: true,
        actorEmail: true,
        startTime: true,
        endTime: true,
        status: true,
        priceCents: true,
      },
    });

    return NextResponse.json({ ok: true, bookings });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}