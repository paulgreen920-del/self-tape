// app/reader/[id]/page.tsx
import CalendarBooking from './CalendarBooking';
import BookingsList from './BookingsList';
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

// In dev, force dynamic so this page isn't statically preresolved
export const dynamic = "force-dynamic";

function minsToLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

type Params = { id: string };

// Accept params as either a value or a Promise (Next 16 behavior)
export default async function ReaderDetailPage(
  props: { params: Params } | { params: Promise<Params> }
) {
  const raw = (props as any).params;
  const resolved: Params = typeof raw?.then === "function" ? await raw : raw;

  const id = Array.isArray(resolved?.id) ? resolved.id[0] : resolved?.id;
  if (!id) notFound();

  const reader = await prisma.reader.findUnique({
    where: { id },
    include: {
      availability: { orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }] },
    },
  });

  if (!reader) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">{reader.displayName}</h1>
      <p className="text-muted-foreground mt-1">{reader.email}</p>

      {reader.bio ? (
        <p className="mt-4 text-sm text-muted-foreground">{reader.bio}</p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Availability</h2>
        {reader.availability.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            No availability yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {reader.availability.map((s) => (
              <li key={s.id} className="rounded border p-3">
                Day {s.dayOfWeek}: {minsToLabel(s.startMin)} – {minsToLabel(s.endMin)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <CalendarBooking reader={reader} availability={reader.availability} />
      </section>

      <section className="mt-10">
        <BookingsList readerId={id} />
      </section>
    </main>
  );
}