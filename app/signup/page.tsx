import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold">Signup</h1>
        <p className="mt-2 text-sm text-gray-600">Create an account to become a reader or to book readers.</p>

        <div className="mt-6 space-y-3">
          <Link href="/reader" className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md">I'm a Reader</Link>
          <Link href="/" className="block w-full text-center px-4 py-2 border rounded-md">I'm an Actor</Link>
        </div>
      </div>
    </main>
  );
}
