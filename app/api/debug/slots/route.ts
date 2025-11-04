// app/api/debug/slots/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const readerId = url.searchParams.get("readerId") || "";
    if (!readerId) {
      return NextResponse.json({ error: "readerId required" }, { status: 400 });
    }
    const slots = await prisma.availabilitySlot.findMany({
      where: { readerId },
      orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
    });
    return NextResponse.json({ readerId, count: slots.length, slots });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
