import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TimeSlot = {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { readerId, slots } = body as { readerId: string; slots: TimeSlot[] };

    if (!readerId) {
      return NextResponse.json({ ok: false, error: "Missing readerId" }, { status: 400 });
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ ok: false, error: "No availability slots provided" }, { status: 400 });
    }

    // Validate slots
    for (const slot of slots) {
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        return NextResponse.json({ ok: false, error: "Invalid day of week" }, { status: 400 });
      }
      if (slot.startMin < 0 || slot.startMin >= 1440) {
        return NextResponse.json({ ok: false, error: "Invalid start time" }, { status: 400 });
      }
      if (slot.endMin < 0 || slot.endMin > 1440) {
        return NextResponse.json({ ok: false, error: "Invalid end time" }, { status: 400 });
      }
      if (slot.startMin >= slot.endMin) {
        return NextResponse.json({ ok: false, error: "Start time must be before end time" }, { status: 400 });
      }
    }

    // Delete existing slots for this reader
    await prisma.availabilitySlot.deleteMany({
      where: { readerId },
    });

    // Create new slots
    await prisma.availabilitySlot.createMany({
      data: slots.map((slot) => ({
        readerId,
        dayOfWeek: slot.dayOfWeek,
        startMin: slot.startMin,
        endMin: slot.endMin,
      })),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[availability] Error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to save" }, { status: 500 });
  }
}