import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[webhook] Signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log("[webhook] Event type:", event.type);

    // Handle subscription events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.metadata?.type === "reader_subscription") {
          const readerId = session.metadata.readerId;
          const subscriptionId = session.subscription as string;

          // Update reader with subscription info
          await prisma.reader.update({
            where: { id: readerId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: "active",
            },
          });

          console.log(`[webhook] Subscription activated for reader ${readerId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find reader by subscription ID
        const reader = await prisma.reader.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (reader) {
          await prisma.reader.update({
            where: { id: reader.id },
            data: {
              subscriptionStatus: subscription.status,
              subscriptionEndsAt: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });

          console.log(`[webhook] Subscription updated for reader ${reader.id}: ${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        const reader = await prisma.reader.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (reader) {
          await prisma.reader.update({
            where: { id: reader.id },
            data: {
              subscriptionStatus: "canceled",
              subscriptionEndsAt: new Date(),
            },
          });

          console.log(`[webhook] Subscription canceled for reader ${reader.id}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[webhook] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}