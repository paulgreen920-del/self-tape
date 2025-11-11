'use client';
import { useEffect, useState } from 'react';

type Booking = {
  id: string;
  actorName: string;
  actorEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  priceCents: number;
};

export default function BookingsList({ readerId }: { readerId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/bookings?readerId=${readerId}&scope=all`);
        const json = await res.json();
        if (json?.ok) setBookings(json.bookings || []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [readerId]);

  if (loading) return <p>Loading bookings…</p>;
  if (!bookings.length) return <p>No bookings yet.</p>;

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Bookings</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {bookings.map(b => (
          <li key={b.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ fontWeight: 600 }}>
              {b.actorName} <span style={{ color: '#666' }}>({b.actorEmail})</span>
            </div>
            <div style={{ fontSize: 14 }}>
              {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()} • {b.status} • ${(b.priceCents / 100).toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
