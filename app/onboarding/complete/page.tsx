"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const readerId = (searchParams.get("readerId") ?? searchParams.get("id") ?? "").trim();

  const [reader, setReader] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReader() {
      if (!readerId) return;

      try {
        const res = await fetch(`/api/readers?id=${readerId}`);
        const data = await res.json();
        if (data.ok && data.reader) {
          setReader(data.reader);
        }
      } catch (err) {
        console.error("Failed to load reader:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReader();
  }, [readerId]);

  return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to the Readers Community!</h1>
        <p className="text-gray-600">
          {loading
            ? "Loading..."
            : `Congratulations ${reader?.displayName || ""}! Your profile is complete.`}
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-4">What's Next?</h2>
        <ul className="text-left space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">✓</span>
            <span>Profile created with your headshot and bio</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">✓</span>
            <span>Google Calendar connected for automatic scheduling</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">✓</span>
            <span>Availability set - actors can now book your open time slots</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 mt-0.5">✓</span>
            <span>Stripe Connect enabled - you'll receive payments automatically</span>
          </li>
        </ul>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          type="button"
          className="border rounded px-6 py-2"
          onClick={() => router.push(`/reader/${readerId}`)}
        >
          View My Profile
        </button>
        <button
          type="button"
          className="bg-emerald-600 text-white rounded px-6 py-2 hover:bg-emerald-700"
          onClick={() => router.push("/")}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}