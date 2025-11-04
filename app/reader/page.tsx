export default function ReaderPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <section className="bg-white shadow-lg rounded-xl p-10 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
          🎭 Reader Onboarding
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Help other actors by offering your time as a reader! Fill out your details below.
        </p>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Sarah Michaels"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
            <input
              type="number"
              placeholder="25"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Availability Notes</label>
            <textarea
              placeholder="Weeknights after 6pm, weekends flexible..."
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Save Profile
          </button>
        </form>
      </section>
    </main>
  );
}
