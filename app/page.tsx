import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Find professional readers for your self-tape auditions</h1>
            <p className="mt-4 text-lg text-gray-600">Quickly connect with experienced readers, set your rate, and record confident self-tapes from anywhere.</p>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
              <form className="w-full sm:w-auto flex items-center bg-white rounded-lg shadow p-2">
                <input
                  aria-label="Search readers"
                  placeholder="Search readers, genres, or services"
                  className="flex-1 px-4 py-3 rounded-l-md placeholder-gray-400 focus:outline-none"
                />
                <button className="ml-2 px-4 py-3 bg-rose-600 text-white rounded-md">Search</button>
              </form>

              <div className="flex space-x-3">
                <Link href="/readers" className="px-5 py-3 bg-rose-600 text-white rounded-md">Browse readers</Link>
                <Link href="/signup" className="px-5 py-3 border rounded-md">Become a reader</Link>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="px-3 py-2 bg-white rounded-full shadow">Instant booking</span>
              <span className="px-3 py-2 bg-white rounded-full shadow">Secure payments</span>
              <span className="px-3 py-2 bg-white rounded-full shadow">Top-rated readers</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-lg bg-gray-100">
              {/* Use local image from public folder */}
              <img
                src="/article_full@1x.png"
                alt="Actor recording a self-tape audition"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-semibold">Popular categories</h2>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">Commercial reads</div>
            <div className="card">Theatre scenes</div>
            <div className="card">Accent coaching</div>
            <div className="card">Cold reads</div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold">Why actors choose us</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">Reliable readers on demand</div>
          <div className="card">Flexible scheduling and rates</div>
          <div className="card">Secure and private sessions</div>
        </div>
      </section>
    </main>
  );
}
