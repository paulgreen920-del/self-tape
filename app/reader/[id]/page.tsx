// app/reader/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

function minsToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export default async function ReaderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const reader = await prisma.reader.findUnique({
    where: { id: params.id },
    include: { availability: { orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }] } },
  });

  if (!reader) return notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <a href="/readers" className="text-sm text-muted-foreground hover:underline">
        ← Back to Readers
      </a>

      <header className="mt-4 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-muted grid place-items-center text-xl font-semibold">
          {reader.headshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={reader.headshotUrl}
              alt={reader.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            reader.displayName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{reader.displayName}</h1>
          <p className="text-sm text-muted-foreground">{reader.email}</p>
        </div>
      </header>

      {reader.bio ? (
        <p className="mt-4 text-sm text-muted-foreground">{reader.bio}</p>
      ) : null}

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Timezone</div>
          <div className="font-medium">{reader.timezone}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Rates</div>
          <div className="text-sm">
            <div>15m: ${(reader.ratePer15Min / 100).toFixed(0)}</div>
            <div>30m: ${(reader.ratePer30Min / 100).toFixed(0)}</div>
            <div>60m: ${(reader.ratePer60Min / 100).toFixed(0)}</div>
          </div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-xs text-muted-foreground">Status</div>
          <div className="font-medium">{reader.isActive ? "Active" : "Inactive"}</div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Weekly Availability</h2>
        {reader.availability.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No availability posted yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reader.availability.map((slot) => (
              <li key={slot.id} className="rounded-xl border p-4">
                <div className="text-sm">
                  <span className="font-medium">
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][slot.dayOfWeek]}
                  </span>{" "}
                  • {minsToTime(slot.startMin)} – {minsToTime(slot.endMin)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <a
          href={`/onboarding/schedule?readerId=${encodeURIComponent(reader.id)}`}
          className="inline-flex items-center justify-center rounded-xl border bg-foreground px-5 py-2.5 text-background transition hover:opacity-90"
        >
          Choose a time
        </a>
      </div>
    </main>
  );
}
