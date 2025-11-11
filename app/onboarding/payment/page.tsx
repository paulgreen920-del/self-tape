"use client";

export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const readerId = (searchParams.get("readerId") ?? searchParams.get("id") ?? "").trim();

  const [loading, setLoading] = useState(false);

  async function connectStripe() {
    if (!readerId) {
      alert("Missing readerId");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readerId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to start Stripe onboarding");
      }

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Failed to connect Stripe");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Set Up Payments</h1>
      <p className="text-sm text-gray-600 mb-6">
        Connect your Stripe account to receive payments from actors who book sessions with you.
      </p>

      <div className="border rounded-lg p-6 bg-white">
        <h2 className="font-semibold mb-2">Stripe Connect</h2>
        <p className="text-sm text-gray-600 mb-4">
          Stripe handles all payments securely. You'll be redirected to Stripe to complete your account setup.
        </p>

        <button
          type="button"
          className="bg-emerald-600 text-white rounded px-4 py-2 hover:bg-emerald-700 disabled:opacity-50"
          onClick={connectStripe}
          disabled={loading}
        >
          {loading ? "Connecting..." : "Connect with Stripe"}
        </button>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="border rounded px-4 py-2"
          onClick={() => router.push(`/onboarding/availability?readerId=${readerId}`)}
        >
          Back
        </button>
      </div>
    </div>
  );
}