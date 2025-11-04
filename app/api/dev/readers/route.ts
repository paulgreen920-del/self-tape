// app/api/dev/readers/route.ts
import { NextResponse } from "next/server";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export async function GET() {
  const readers = await prisma.reader.findMany({
    select: { id: true, email: true, displayName: true, stripeAccountId: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ count: readers.length, readers });
}
