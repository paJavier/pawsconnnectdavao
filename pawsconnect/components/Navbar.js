"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-base/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
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

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-3 md:flex">
          <Link
            href="/how-it-works"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary ring-2 ring-primary/20 transition hover:ring-primary/40"
          >
            About Us
          </Link>

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
            href="/volunteer/login"
            className="text-sm font-semibold text-secondary underline decoration-secondary/50 underline-offset-4 hover:decoration-secondary"
          >
            Volunteer Login
          </Link>
        </nav>

        {/* Hamburger Button (Mobile) */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden rounded-lg border border-black/10 p-2 text-primary"
          aria-label="Toggle menu"
        >
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className="md:hidden border-t border-black/5 bg-base px-6 pb-4">
          <nav className="flex flex-col gap-3 pt-4">
            <Link
              href="/how-it-works"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary ring-2 ring-primary/20"
            >
              About Us
            </Link>

            <Link
              href="/report"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Report
            </Link>

            <Link
              href="/status"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary ring-2 ring-primary/20"
            >
              Track
            </Link>

            <Link
              href="/volunteer/login"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-secondary underline decoration-secondary/50 underline-offset-4"
            >
              Volunteer Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
