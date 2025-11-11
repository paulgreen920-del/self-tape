// app/onboarding/reader/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

const UNION_OPTIONS = ["SAG-AFTRA", "AEA", "AGVA", "Non-Union"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Italian", "German", "Mandarin"];
const SPECIALTY_OPTIONS = ["Comedy", "Drama", "Shakespeare", "Musical Theatre", "Improvisation", "Accents"];

type LinkItem = { label: string; url: string };

export default function ReaderOnboardingMini() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  // Playable age (numeric min/max) + gender
  const [playableAgeMin, setPlayableAgeMin] = useState<number | "">("");
  const [playableAgeMax, setPlayableAgeMax] = useState<number | "">("");
  const [gender, setGender] = useState("");

  // Rates in dollars (UI)
  const [rate15Usd, setRate15Usd] = useState<number | "">(15);
  const [rateUsd, setRateUsd] = useState<number | "">(25); // 30-min
  const [rate60Usd, setRate60Usd] = useState<number | "">(60);

  const [unions, setUnions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  // Headshot
  const [headshotUrl, setHeadshotUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Links
  const [links, setLinks] = useState<LinkItem[]>([{ label: "", url: "" }]);

  const [busy, setBusy] = useState(false);
  const canSubmit = displayName.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  function toggleItem(value: string, setFn: React.Dispatch<React.SetStateAction<string[]>>) {
    setFn((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  // Upload headshot — uses absolute URL returned by API
  async function handleHeadshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.absoluteUrl) throw new Error(data?.error || "Upload failed");
      setHeadshotUrl(data.absoluteUrl);
    } catch (err: any) {
      alert(err.message || "Upload failed");
      setHeadshotUrl("");
    } finally {
      setUploading(false);
    }
  }

  function updateLink(index: number, key: keyof LinkItem, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [key]: value } : l)));
  }
  function addLinkRow() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }
  function removeLinkRow(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // Guard: age range
    if (
      playableAgeMin !== "" &&
      playableAgeMax !== "" &&
      Number(playableAgeMin) > Number(playableAgeMax)
    ) {
      alert("Playable age: Min must be ≤ Max.");
      return;
    }

    if (uploading) {
      alert("Please wait for the headshot to finish uploading.");
      return;
    }

    setBusy(true);
    try {
      const cleanLinks = links.filter((l) => l.label.trim() && l.url.trim());

      const payload = {
        displayName,
        email,
        phone,
        timezone,
        city,
        bio,
        playableAgeMin: playableAgeMin === "" ? null : Number(playableAgeMin),
        playableAgeMax: playableAgeMax === "" ? null : Number(playableAgeMax),
        gender: gender || null,
        headshotUrl,
        rate15Usd: rate15Usd === "" ? 0 : rate15Usd,
        rateUsd: rateUsd === "" ? 0 : rateUsd,
        rate60Usd: rate60Usd === "" ? 0 : rate60Usd,
        unions,
        languages,
        specialties,
        links: cleanLinks,
      };

      console.log("[onboarding] POST /api/readers payload:", payload);

      const res = await fetch("/api/readers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Read as text first, then safely try JSON (prevents crashes on HTML/stack traces)
      const raw = await res.text().catch(() => "");
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        console.warn("[onboarding] Non-JSON response:", raw.slice(0, 300));
      }

      if (!res.ok || !data?.ok) {
        if (res.status === 409) {
          alert("That email is already registered as a reader. Try a different email.");
        } else {
          const msg =
            data?.error ||
            `Failed to save (HTTP ${res.status}). ${raw ? raw.slice(0, 200) : ""}`;
          alert(msg);
        }
        return;
      }

      const readerId = data?.readerId || data?.id;
      if (!readerId) {
        alert("Saved, but missing readerId from server response.");
        return;
      }

      // Minimal reset (optional)
      setDisplayName("");
      setEmail("");
      setPhone("");
      setTimezone("America/New_York");
      setCity("");
      setBio("");
      setHeadshotUrl("");
      setPlayableAgeMin("");
      setPlayableAgeMax("");
      setGender("");
      setRate15Usd(15);
      setRateUsd(25);
      setRate60Usd(60);
      setUnions([]);
      setLanguages([]);
      setSpecialties([]);
      setLinks([{ label: "", url: "" }]);

      // Use hard redirect to avoid any router quirks
      window.location.href = `/onboarding/schedule?readerId=${encodeURIComponent(readerId)}`;
      return;
    } catch (err: any) {
      console.error("[onboarding] submit error:", err);
      alert(err?.message || "Unexpected error while saving.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Quick Reader Onboarding</h1>
      <form onSubmit={submit} className="space-y-4">
        {/* Headshot */}
        <div>
          <label className="block text-sm font-medium">Headshot</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm"
            onChange={handleHeadshotChange}
          />
          {uploading && <p className="text-xs mt-1">Uploading…</p>}
          {headshotUrl && (
            <div className="mt-2">
              <a href={headshotUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={headshotUrl}
                  alt="Headshot preview"
                  className="h-28 w-28 object-cover rounded"
                />
              </a>
              <p className="text-xs text-blue-600 mt-1 break-all">
                <a href={headshotUrl} target="_blank" rel="noopener noreferrer">
                  {headshotUrl}
                </a>
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Display name</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Paul Green"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="border rounded px-3 py-2 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="paul@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 555 5555"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Timezone</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {[
              "America/New_York",
              "America/Chicago",
              "America/Denver",
              "America/Los_Angeles",
              "Europe/London",
              "Europe/Paris",
              "Asia/Tokyo",
            ].map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="New York, NY"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            className="border rounded px-3 py-2 w-full min-h-[100px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell actors what it's like to work with you."
          />
        </div>

        {/* Playable Age & Gender */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Playable Age Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                className="border rounded px-3 py-2 w-20 text-center"
                placeholder="Min"
                value={playableAgeMin}
                onChange={(e) => setPlayableAgeMin(e.target.value === "" ? "" : Number(e.target.value))}
              />
              <span>–</span>
              <input
                type="number"
                min={0}
                max={120}
                className="border rounded px-3 py-2 w-20 text-center"
                placeholder="Max"
                value={playableAgeMax}
                onChange={(e) => setPlayableAgeMax(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Numbers only — your typical playable age range.</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Gender</label>
            <select
              name="gender"
              className="w-full rounded-md border px-3 py-2 bg-white"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="" disabled>Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Transgender">Transgender</option>
              <option value="Prefer not to say">Prefer not to say</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Rates */}
        <div>
          <label className="block text-sm font-medium">Rate per 15 min (USD)</label>
          <input
            type="number"
            min={0}
            step={1}
            className="border rounded px-3 py-2 w-full"
            value={rate15Usd}
            onChange={(e) => setRate15Usd(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="15"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Rate per 30 min (USD)</label>
          <input
            type="number"
            min={0}
            step={1}
            className="border rounded px-3 py-2 w-full"
            value={rateUsd}
            onChange={(e) => setRateUsd(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="25"
          />
          <p className="text-xs text-gray-500 mt-1">Saved as cents in DB (e.g., $25 → 2500).</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Rate per 60 min (USD)</label>
          <input
            type="number"
            min={0}
            step={1}
            className="border rounded px-3 py-2 w-full"
            value={rate60Usd}
            onChange={(e) => setRate60Usd(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="60"
          />
        </div>

        {/* Unions */}
        <div>
          <label className="block text-sm font-medium">Union</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {UNION_OPTIONS.map((u) => (
              <label key={u} className="flex items-center gap-2 border rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={unions.includes(u)}
                  onChange={() => toggleItem(u, setUnions)}
                />
                <span>{u}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium">Languages</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {LANGUAGE_OPTIONS.map((l) => (
              <label key={l} className="flex items-center gap-2 border rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={languages.includes(l)}
                  onChange={() => toggleItem(l, setLanguages)}
                />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-sm font-medium">Specialties</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SPECIALTY_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 border rounded px-3 py-2">
                <input
                  type="checkbox"
                  checked={specialties.includes(s)}
                  onChange={() => toggleItem(s, setSpecialties)}
                />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <label className="block text-sm font-medium">Links</label>
          <div className="space-y-3 mt-2">
            {links.map((l, i) => (
              <div key={i} className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Label (e.g., Website, Instagram)"
                    value={l.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                  />
                  <input
                    className="border rounded px-3 py-2 w-full"
                    placeholder="https://example.com/your-profile"
                    value={l.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="border rounded px-3 py-1"
                    onClick={addLinkRow}
                  >
                    + Add link
                  </button>
                  {links.length > 1 && (
                    <button
                      type="button"
                      className="border rounded px-3 py-1"
                      onClick={() => removeLinkRow(i)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="border rounded px-4 py-2 disabled:opacity-50"
          type="submit"
          disabled={!canSubmit || busy || uploading}
          title={uploading ? "Please wait for the headshot to finish uploading" : ""}
        >
          {busy ? "Saving..." : uploading ? "Uploading…" : "Save"}
        </button>
      </form>
    </div>
  );
}
