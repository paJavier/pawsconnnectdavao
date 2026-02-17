import Link from "next/link";

export default function Home() {
  return (
    <section className="grid gap-6 py-10 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-4xl font-bold">PawsConnect Davao</h1>
        <p className="mt-3 text-gray-700">
          A location-based platform that will allow residents to report stray animals
          quickly and connect with nearby volunteers or organizations.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/report"
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            Report Stray
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-xl border px-4 py-2"
          >
            How It Works
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 text-gray-600">
        <p className="font-semibold">How it works (Preview)</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Report</li>
          <li>Match</li>
          <li>Alert</li>
          <li>Respond</li>
        </ol>
      </div>
    </section>
  );
}
