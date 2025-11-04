// app/api/stripe/onboard/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

// ESM-safe Prisma import
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { readerId } = await req.json();
    if (!readerId) {
      return NextResponse.json({ error: "readerId required" }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }
    const stripe = new Stripe(secret);

    // 1) Verify reader exists
    const reader = await prisma.reader.findUnique({
      where: { id: readerId },
      select: { id: true, email: true, stripeAccountId: true },
    });
    if (!reader) return NextResponse.json({ error: "Reader not found" }, { status: 404 });

    // 2) Create/connect account if missing
    let accountId = reader.stripeAccountId ?? null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: reader.email,
        business_type: "individual",
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });
      accountId = account.id;

      await prisma.reader.update({
        where: { id: readerId },
        data: { stripeAccountId: accountId },
      });
    }

    // 3) Create onboarding link
    const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL || `${base}/connect/refresh?readerId=${readerId}`;
    const returnUrl  = process.env.STRIPE_CONNECT_RETURN_URL  || `${base}/connect/return?readerId=${readerId}`;

    const link = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url, accountId });
  } catch (err: any) {
    console.error("Onboard error:", err);
    return NextResponse.json({ error: "Server error", debug: err?.message || String(err) }, { status: 500 });
  }
}
