// app/onboarding/schedule/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ReaderLite = { id: string; displayName: string | null; email: string | null };

export default function OnboardingSchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Accept readerId OR id
  const readerId = useMemo(() => {
    const rid = (searchParams.get("readerId") ?? searchParams.get("id") ?? "").trim();
    return rid;
  }, [searchParams]);

  const [reader, setReader] = useState<ReaderLite | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // --- NEW: reflect connection state without DB (via cookie or ?connected=google)
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);

  const firstName = useMemo(() => {
    const dn = (reader?.displayName || "").trim();
    if (dn) return dn.split(/\s+/)[0];
    const em = (reader?.email || "").trim();
    if (em && em.includes("@")) return em.split("@")[0];
    return "";
  }, [reader]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr(null);

      if (!readerId) {
        setErr("Missing readerId in the URL. Please return to onboarding and save your profile again.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/readers?id=${encodeURIComponent(readerId)}`, {
          headers: { Accept: "application/json" },
        });

        const raw = await res.text().catch(() => "");
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          // non-JSON; ignore
        }

        if (!res.ok || !data?.ok || !data?.reader) {
          const msg =
            data?.error ||
            (raw
              ? `Failed to load reader (HTTP ${res.status}). Body: ${raw.slice(0, 200)}…`
              : `Failed to load reader (HTTP ${res.status}).`);
          throw new Error(msg);
        }

        if (!ignore) setReader(data.reader as ReaderLite);
      } catch (e: any) {
        if (!ignore) setErr(e?.message || "Failed to load reader.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [readerId]);

  // --- NEW: detect “connected” (cookie from callback or URL param)
  useEffect(() => {
    const urlFlag = (searchParams.get("connected") || "").toLowerCase() === "google";
    const cookieFlag = typeof document !== "undefined" && document.cookie.includes("gcal_connected=1");
    setGoogleConnected(urlFlag || cookieFlag);
  }, [searchParams]);

  // ---- Start Google OAuth via our API
  async function goGoogle() {
    try {
      if (!readerId) {
        alert("Missing readerId — please finish the previous step first.");
        return;
      }
      const res = await fetch(`/api/calendar/google/start?readerId=${encodeURIComponent(readerId)}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok || !data?.authUrl) {
        throw new Error(data?.error || `Failed to start Google OAuth (HTTP ${res.status}).`);
      }

      window.location.href = data.authUrl as string; // go to Google consent screen
    } catch (e: any) {
      alert(e?.message || "Could not start Google connection.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      {/* Friendly header */}
      <h1 className="text-2xl sm:text-3xl font-bold">
        {loading
          ? "Welcome to the readers community…"
          : `Welcome to the readers community, ${firstName || "friend"}!`}
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        Just a few more steps before you’re ready to help fellow actors with their self-tapes.
        We’ll sync bookings to your calendar and let actors book times you make available.
      </p>

      {/* Errors */}
      {err ? (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{err}</p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="rounded border px-3 py-1 text-sm"
              onClick={() => router.push("/onboarding/reader")}
            >
              Go back to onboarding
            </button>
            {readerId && (
              <a
                className="rounded border px-3 py-1 text-sm"
                href={`/api/readers?id=${encodeURIComponent(readerId)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open API response
              </a>
            )}
          </div>
        </div>
      ) : (
        !loading &&
        reader && (
          <p className="text-sm text-gray-500 mt-6">
            Setting up scheduling for <strong>{reader.displayName || reader.email}</strong>.
          </p>
        )
      )}

      {/* Calendar Sync */}
      <section className="mt-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Connect your calendar</h2>

          {/* NEW: small badge if Google is connected */}
          {googleConnected && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              Google connected
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Choose a provider to sync bookings automatically.
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          <button
            type="button"
            className={`rounded-xl border px-4 py-3 bg-white text-left ${
              googleConnected ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
            }`}
            onClick={googleConnected ? undefined : goGoogle}
            disabled={googleConnected || !!err || loading}
            title={googleConnected ? "Already connected" : err ? "Fix the error above first" : ""}
          >
            <div className="font-medium">Google Calendar</div>
            <div className="text-xs text-gray-500">
              {googleConnected ? "Connected" : "Use your Google account"}
            </div>
          </button>

          <button
            type="button"
            className="rounded-xl border px-4 py-3 bg-white hover:bg-gray-50 text-left"
            onClick={() => alert("Microsoft Outlook connect: coming next")}
          >
            <div className="font-medium">Microsoft Outlook</div>
            <div className="text-xs text-gray-500">Use your Microsoft account</div>
          </button>

          <button
            type="button"
            className="rounded-xl border px-4 py-3 bg-white hover:bg-gray-50 text-left"
            onClick={() => alert("iCal feed setup: coming next")}
          >
            <div className="font-medium">iCal Feed</div>
            <div className="text-xs text-gray-500">Subscribe in Apple or other apps</div>
          </button>
        </div>
      </section>

      {/* Availability */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Set your availability</h2>
        <p className="text-sm text-gray-600">
          After connecting a calendar, choose which hours actors can book. We’ll block off times that
          conflict with events on your connected calendar.
        </p>
      </section>

      {/* Footer actions */}
      <div className="mt-12 flex gap-3">
        <button
          type="button"
          className="rounded-lg border px-4 py-2"
          onClick={() => router.push("/")}
        >
          Back to Home
        </button>
        <button
          type="button"
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
          onClick={() => router.push(`/onboarding/availability?readerId=${readerId}`)}
        >
          Continue
        </button>
      </div>
    </main>
  );
}
