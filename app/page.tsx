export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-white px-6">
      {/* HERO SECTION */}
      <section className="max-w-5xl w-full text-center py-20">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight">
          🎬 Self-Tape Reader <span className="text-emerald-600">Marketplace</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Actors helping actors — find readers, book sessions, and level up your
          self-tapes effortlessly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="/reader"
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Become a Reader
          </a>
          <a
            href="/actor"
            className="px-6 py-3 bg-white border border-emerald-600 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition"
          >
            Find a Reader
          </a>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section className="max-w-5xl w-full grid sm:grid-cols-3 gap-8 py-20 border-t">
        {[
          {
            title: "Fast Booking",
            desc: "Connect instantly with available readers and secure your slot in minutes.",
          },
          {
            title: "Verified Readers",
            desc: "Work with experienced readers who understand performance and timing.",
          },
          {
            title: "Calendar Sync",
            desc: "Easily manage sessions and reminders via Google, Outlook, or iCal.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-lg text-emerald-700 mb-2">
              {f.title}
            </h3>
            <p className="text-gray-600 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
