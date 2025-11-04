// app/api/readers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      displayName,
      email,
      phone,
      timezone,
      city,
      bio,
      rateUsd,             // still supported (30-min, dollars) - optional
      rate15Usd,           // NEW (dollars)
      rate60Usd,           // NEW (dollars)
      unions = [],
      languages = [],
      specialties = [],
      links = [],
      headshotUrl,         // optional for now; file upload comes next
    } = await req.json();

    if (!displayName || !email) {
      return NextResponse.json(
        { error: "displayName and email are required" },
        { status: 400 }
      );
    }

    // dollars -> cents helpers
    const toCents = (v: any, fallback: number) =>
      Number.isFinite(+v) && +v >= 0 ? Math.round(+v * 100) : fallback;

    const ratePer30Min = toCents(rateUsd, 2500);
    const ratePer15Min = toCents(rate15Usd, 1500);
    const ratePer60Min = toCents(rate60Usd, 6000);

    const reader = await prisma.reader.upsert({
      where: { email },
      update: {
        displayName,
        phone: phone ?? null,
        timezone: timezone || "America/New_York",
        city: city ?? null,
        bio: bio ?? null,
        headshotUrl: headshotUrl ?? null,
        ratePer30Min,
        ratePer15Min,
        ratePer60Min,
        unions: Array.isArray(unions) ? unions : [],
        languages: Array.isArray(languages) ? languages : [],
        specialties: Array.isArray(specialties) ? specialties : [],
        links: Array.isArray(links) ? links.filter((l: any) => l?.url && l?.label) : [],
      },
      create: {
        displayName,
        email,
        phone: phone ?? null,
        timezone: timezone || "America/New_York",
        city: city ?? null,
        bio: bio ?? null,
        headshotUrl: headshotUrl ?? null,
        ratePer30Min,
        ratePer15Min,
        ratePer60Min,
        unions: Array.isArray(unions) ? unions : [],
        languages: Array.isArray(languages) ? languages : [],
        specialties: Array.isArray(specialties) ? specialties : [],
        links: Array.isArray(links) ? links.filter((l: any) => l?.url && l?.label) : [],
      },
    });

    return NextResponse.json({ ok: true, readerId: reader.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
