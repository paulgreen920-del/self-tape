// app/api/readers/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";

/**
 * GET /api/readers?id=READER_ID
 * Returns a minimal reader object for onboarding steps.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || url.searchParams.get("readerId") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id/readerId" }, { status: 400 });
    }

    const reader = await prisma.reader.findUnique({
      where: { id },
      select: { id: true, displayName: true, email: true },
    });

    if (!reader) {
      return NextResponse.json({ ok: false, error: "Reader not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, reader }, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/readers] error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/readers
 * Body: {
 *  displayName, email, phone, timezone, city, bio,
 *  playableAgeMin, playableAgeMax, gender,
 *  headshotUrl,
 *  rate15Usd, rateUsd, rate60Usd,
 *  unions[], languages[], specialties[], links: [{label,url}]
 * }
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      displayName,
      email,
      phone,
      timezone,
      city,
      bio,
      playableAgeMin,
      playableAgeMax,
      gender,
      headshotUrl,
      rate15Usd,
      rateUsd, // 30-min
      rate60Usd,
      unions = [],
      languages = [],
      specialties = [],
      links = [],
    } = body ?? {};

    // Basic required fields
    if (!displayName || !email) {
      return NextResponse.json(
        { ok: false, error: "displayName and email are required" },
        { status: 400 }
      );
    }

    // Coerce/validate numbers
    const rate15Cents = Math.max(0, Math.round(Number(rate15Usd || 0) * 100));
    const rate30Cents = Math.max(0, Math.round(Number(rateUsd || 0) * 100));
    const rate60Cents = Math.max(0, Math.round(Number(rate60Usd || 0) * 100));

    const ageMin =
      playableAgeMin === null || playableAgeMin === "" ? null : Number(playableAgeMin);
    const ageMax =
      playableAgeMax === null || playableAgeMax === "" ? null : Number(playableAgeMax);

    if (
      ageMin !== null &&
      ageMax !== null &&
      Number.isFinite(ageMin) &&
      Number.isFinite(ageMax) &&
      ageMin > ageMax
    ) {
      return NextResponse.json(
        { ok: false, error: "Playable age: Min must be ≤ Max." },
        { status: 400 }
      );
    }

    // Create
    const created = await prisma.reader.create({
      data: {
        displayName,
        email,
        phone: phone || null,
        timezone: timezone || "America/New_York",
        city: city || null,
        bio: bio || null,

        // Optional new fields
        playableAgeMin: Number.isFinite(ageMin) ? (ageMin as number) : null,
        playableAgeMax: Number.isFinite(ageMax) ? (ageMax as number) : null,
        gender: gender || null,

        headshotUrl: headshotUrl || null,

        ratePer15Min: rate15Cents,
        ratePer30Min: rate30Cents,
        ratePer60Min: rate60Cents,

        // Use InputJsonValue to satisfy Prisma types across versions
        unions: unions as Prisma.InputJsonValue,
        languages: languages as Prisma.InputJsonValue,
        specialties: specialties as Prisma.InputJsonValue,
        links: links as Prisma.InputJsonValue,

        acceptsTerms: false,
        marketingOptIn: false,
        isActive: true,
      },
      select: { id: true, email: true, displayName: true },
    });

    return NextResponse.json(
      { ok: true, readerId: created.id, reader: created },
      { status: 201 }
    );
  } catch (err: any) {
    // Handle unique email nicely
    if (err?.code === "P2002" && err?.meta?.target?.includes("email")) {
      return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 409 });
    }

    // TEMP DEBUG: echo detailed error so we can see it in PowerShell
    const details = {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      meta: err?.meta,
      stack: err?.stack,
    };
    console.error("[POST /api/readers] error:", details);
    return NextResponse.json({ ok: false, error: "Server error", details }, { status: 500 });
  }
}
