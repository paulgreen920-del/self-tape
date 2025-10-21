import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
export const metadata = {
  title: 'Self-Tape Reader Marketplace',
  description: 'Actors helping actors — find and book readers for self-tapes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {/* Header and Footer components keep layout clean */}
        <Header />
        <Footer />

        <main>{children}</main>

        {/* Keep footer for small screens if needed */}
      </body>
    </html>
  );
}
