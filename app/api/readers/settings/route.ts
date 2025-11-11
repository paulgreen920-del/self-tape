import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { readerId, maxAdvanceBooking, minAdvanceHours, bookingBuffer } = await req.json();

    if (!readerId) {
      return NextResponse.json({ ok: false, error: "Missing readerId" }, { status: 400 });
    }

    await prisma.reader.update({
      where: { id: readerId },
      data: {
        maxAdvanceBooking,
        minAdvanceHours,
        bookingBuffer,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[settings] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}