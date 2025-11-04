// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const stripe = new Stripe(secret);

  try {
    // 1) Read raw body (required for signature verification)
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    // 2) Verify event came from Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error("Invalid webhook signature:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3) Handle successful checkouts
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Prefer updating by bookingId (added in Step 2A)
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "PAID" },
        });
      } else {
        // Fallback for legacy sessions (no bookingId)
        const readerId = session.metadata?.readerId ?? "";
        const actorEmail = session.metadata?.actorEmail ?? "";
        if (readerId && actorEmail) {
          await prisma.booking.updateMany({
            where: { readerId, actorEmail, status: "PENDING" },
            data: { status: "PAID" },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
