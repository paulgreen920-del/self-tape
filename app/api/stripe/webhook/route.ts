// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

// ESM-safe Prisma import
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

export const runtime = "nodejs"; // ensure Node runtime for raw body access

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const fromEmail = process.env.FROM_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe env not configured" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2025-10-29.clover",
  });
  
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // IMPORTANT: raw text, not req.json()
  const buf = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verify failed:", err?.message || err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // We stored these on session.metadata when creating Checkout
        const bookingId = session.metadata?.bookingId;
        const readerId = session.metadata?.readerId;

        if (!bookingId) {
          console.warn("Missing bookingId in session.metadata");
          break;
        }

        // Mark booking PAID (idempotent)
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "PAID" },
        });

        // Optionally fetch booking + reader for email context
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { reader: true },
        });

        // OPTIONAL: send email via Resend (only if configured)
        if (resendKey && fromEmail && booking?.actorEmail) {
          const resend = new Resend(resendKey);
          const start = new Date(booking.startTime);
          const end = new Date(booking.endTime);

          const fmt = (d: Date) =>
            d.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            }) + " UTC";

          const html = `
            <div style="font-family: Arial, sans-serif; line-height:1.6">
              <h2>You're booked! 🎬</h2>
              <p>Hi ${booking.actorName || "there"},</p>
              <p>Your session with <strong>${booking.reader.displayName}</strong> is confirmed.</p>
              <ul>
                <li><strong>Start:</strong> ${fmt(start)}</li>
                <li><strong>End:</strong> ${fmt(end)}</li>
                <li><strong>Duration:</strong> ${booking.durationMin} min</li>
              </ul>
              <p>We’ll send the meeting link before the session.</p>
              <p style="margin-top:24px">— Reader Marketplace</p>
            </div>
          `;

          await resend.emails.send({
            from: fromEmail,
            to: booking.actorEmail,
            subject: "Payment received — your reader session is booked",
            html,
          });
        }

        break;
      }

      // You can add more events as you grow:
      // case "payment_intent.succeeded": { ... } break;
      // case "charge.refunded": { ... } break;

      default:
        // For visibility while testing
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err?.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
