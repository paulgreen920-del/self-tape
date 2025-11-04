import "./globals.css";

export const metadata = {
  title: "ReadersMarket",
  description: "Actors helping actors with self-tapes",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {/* NAVBAR */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
          <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-extrabold tracking-tight">
              Readers<span className="text-emerald-600">Market</span>
            </a>
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <a href="/" className="hover:text-emerald-700">Home</a>
              <a href="/reader" className="hover:text-emerald-700">Reader</a>
              <a href="/actor" className="hover:text-emerald-700">Actor</a>
              <a href="/booking" className="hover:text-emerald-700">Booking</a>
              <a href="/pricing" className="hover:text-emerald-700">Pricing</a>
            </div>
            <a
              href="#"
              className="inline-flex items-center rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Sign in
            </a>
          </nav>
        </header>

        {/* PAGE CONTENT */}
        <main className="max-w-6xl mx-auto px-4 py-10">{children}</main>

        {/* FOOTER */}
        <footer className="mt-16 border-t">
          <div className="max-w-6xl mx-auto px-4 h-16 text-sm flex items-center justify-between">
            <p>© {new Date().getFullYear()} ReadersMarket</p>
            <div className="flex gap-4">
              <a href="/about" className="hover:text-emerald-700">About</a>
              <a href="/pricing" className="hover:text-emerald-700">Pricing</a>
              <a href="#" className="hover:text-emerald-700">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
