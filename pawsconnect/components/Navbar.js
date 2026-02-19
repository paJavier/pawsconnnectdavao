import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-base/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="PawsConnect Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="text-lg font-extrabold text-primary">
            PawsConnect Davao
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/report"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Report
          </Link>

          <Link
            href="/status"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary ring-2 ring-primary/20 transition hover:ring-primary/40"
          >
            Track
          </Link>

          <Link
            href="/volunteer-orgs/dashboard"
            className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
