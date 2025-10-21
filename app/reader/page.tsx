"use client";

import { useState } from "react";

type Availability = {
  [day: string]: boolean;
};

export default function ReaderPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [rate, setRate] = useState(50);
  const [availability, setAvailability] = useState<Availability>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });
  const [submitted, setSubmitted] = useState(false);

  function toggleDay(day: string) {
    setAvailability((prev) => ({ ...prev, [day]: !prev[day] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const selectedDays = Object.entries(availability)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const formData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender: gender || null,
      rate,
      availability: selectedDays,
    };

    if (!formData.name || !formData.email) {
      console.warn("Name and email are required");
      return;
    }

    console.log("Reader signup:", formData);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-3xl w-full bg-white shadow-xl rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Thanks — you’re all set!</h2>
            <p className="mt-2 text-sm text-gray-600">We received your onboarding details. We’ll be in touch soon.</p>
            <button
              className="mt-6 inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-md"
              onClick={() => setSubmitted(false)}
            >
              Back to form
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <section className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold">Become a Reader</h1>
          <p className="mt-4 text-sm opacity-90">Set your rates, availability, and profile details so actors can find and book you.</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>• Easy bookings</li>
            <li>• Set your own rates</li>
            <li>• Flexible availability</li>
          </ul>
        </section>

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-semibold">Reader Onboarding</h2>
          <p className="text-sm text-gray-500 mt-1">Tell us a bit about yourself.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-gray-700">Full name</label>
              <input
                className="mt-1 block w-full rounded-lg border border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-blue-300"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-lg border border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-lg border border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-blue-300"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Gender</label>
                <select
                  className="mt-1 block w-full rounded-lg border border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-blue-300"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="male-identifying">Male Identifying</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Rate (USD / hour)</label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 block w-full rounded-lg border border-gray-200 p-3 shadow-sm focus:ring-2 focus:ring-blue-300"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Availability</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.keys(availability).map((day) => (
                    <label key={day} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={availability[day]}
                        onChange={() => toggleDay(day)}
                        className="rounded"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
              >
                Get started
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
