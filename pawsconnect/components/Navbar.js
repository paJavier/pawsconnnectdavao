import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold">
          PawsConnect Davao
        </Link>

        {/* Public links (no login needed for reporters) */}
        <div className="flex items-center gap-4 text-sm">
          <Link href="/how-it-works" className="hover:underline">
            How It Works
          </Link>
          <Link href="/report" className="hover:underline">
            Report Stray
          </Link>
          <Link href="/status" className="hover:underline">
            Track Ticket
          </Link>

          {/* Volunteer */}
          <Link
            href="/volunteer/login"
            className="rounded-lg border px-3 py-1 hover:bg-gray-50"
          >
            Volunteer Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
