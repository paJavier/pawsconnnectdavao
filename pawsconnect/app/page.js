"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const partnerGroups = [
  { name: "Happy Animals Club" },
  { name: "Davao Rescue Org" },
  { name: "Paw Patrol Volunteers" },
  { name: "City Shelter Partner" },
];

// Parallax hook
function useParallax(strength = 0.22) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * strength);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [strength]);

  return offset;
}

// Scroll reveal wrapper (no library)
function Reveal({ children, className = "" }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700 ease-out",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

// Floating paw layer
function FloatingPaws() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <span className="paw-float absolute left-[8%] top-[18%] text-3xl opacity-30">
        🐾
      </span>
      <span className="paw-float-slow absolute left-[22%] top-[55%] text-4xl opacity-25">
        🐾
      </span>
      <span className="paw-float-fast absolute right-[12%] top-[22%] text-3xl opacity-25">
        🐾
      </span>
      <span className="paw-float-slow absolute right-[18%] top-[62%] text-5xl opacity-20">
        🐾
      </span>
    </div>
  );
}

export default function Home() {
  const parallaxY = useParallax(0.22);

  return (
    <main className="min-h-screen bg-gradient-to-b from-base/90 to-white">
      {/* HERO with parallax background */}
      <section className="relative overflow-hidden">
        {/* Background image (subtle blur + parallax) */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-[1.5px]"
          style={{
            backgroundImage: "url('/images/home.jpg')",
            transform: `translateY(${parallaxY}px) scale(1.1)`,
          }}
          aria-hidden="true"
        />

        {/* Warm overlay for readability */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-base/90 via-base/70 to-white/85"
          aria-hidden="true"
        />

        {/* Floating paws */}
        <FloatingPaws />

        {/* Hero content */}
        <div className="relative z-20 mx-auto max-w-6xl px-6 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            {/* LEFT */}
            <div className="animate-fadeUp">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm ring-1 ring-black/5">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                Helping Davao care for stray animals together
              </div>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-primary md:text-5xl">
                PawsConnect Davao
              </h1>

              <p className="mt-4 text-lg text-neutral-800">
                A community-driven space where residents can report stray animals and help them find the care and attention they deserve.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/report"
                  className="group inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                >
                  Report a Stray
                  <span className="ml-2 transition group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>

                <Link
                  href="/status"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-primary shadow-sm ring-2 ring-primary/20 transition hover:-translate-y-0.5 hover:ring-primary/40 active:translate-y-0"
                >
                  Track My Report
                </Link>
              </div>

              {/* Partner Section */}
              <div className="mt-10 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-primary">
                    Partner volunteer groups
                  </h2>
                  <Link
                    href="/partners"
                    className="text-sm font-semibold text-secondary underline decoration-secondary/50 underline-offset-4 hover:decoration-secondary"
                  >
                    View all →
                  </Link>
                </div>

                <p className="mt-2 text-sm text-neutral-700">
                  These groups will receive alerts and accept cases through the volunteer dashboard.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {partnerGroups.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="h-10 w-10 rounded-xl bg-base ring-1 ring-black/5" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {p.name}
                        </p>
                        <p className="text-xs text-neutral-600">Verified partner</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/how-it-works"
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    How PawsConnect works
                  </Link>

                  <Link
                    href="/partners"
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-secondary ring-2 ring-secondary/20 transition hover:-translate-y-0.5 hover:ring-secondary/40"
                  >
                    Meet our partners
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <aside className="animate-fadeUp delay-100">
              <div className="rounded-3xl bg-white/95 p-7 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-primary">
                    Volunteers & Groups
                  </h2>
                  <span className="rounded-full bg-base/60 px-3 py-1 text-xs font-semibold text-neutral-800">
                    Protected
                  </span>
                </div>

                <p className="mt-2 text-sm text-neutral-700">
                  Volunteer accounts will receive alerts and manage cases in the dashboard.
                </p>

                <div className="mt-6 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700">Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700">Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <Link
                      href="/volunteer/forgot"
                      className="text-xs font-semibold text-secondary underline decoration-secondary/50 underline-offset-4 hover:decoration-secondary"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="grid gap-3">
                    <Link
                      href="/volunteer/login"
                      className="rounded-xl bg-secondary px-5 py-3 text-center font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      Log In
                    </Link>

                    <div className="text-center text-xs text-neutral-700">
                      Need an account?{" "}
                      <Link
                        href="/volunteer/signup"
                        className="font-semibold text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
                      >
                        Sign up
                      </Link>
                    </div>

                    <div className="rounded-2xl bg-base/40 p-4 text-xs text-neutral-800">
                      <p className="font-semibold">Dashboard access is restricted.</p>
                      <p className="mt-1">
                        Only verified volunteer groups can accept and update cases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* IMPACT (Reveal on scroll) */}
      <Reveal className="mx-auto mt-20 max-w-6xl px-6 pb-16">
        <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-2xl font-extrabold text-primary">
                Our Community Impact
              </h3>
              <p className="text-sm text-neutral-700">
                Prototype metrics for demonstration (will update with real usage data).
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-base/60 px-4 py-2 text-xs font-semibold text-neutral-800">
              SDG 11 • SDG 15
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard value="15 mins" label="Average Response Time" />
            <StatCard value="128" label="Reports Submitted" />
            <StatCard value="92" label="Successful Rescues" />
            <StatCard value="14" label="Active Volunteer Groups" />
          </div>

          <div className="mt-7 rounded-2xl bg-base/45 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Quick overview</p>
              <p className="text-xs text-neutral-700">Higher = more activity</p>
            </div>

            <div className="mt-4 space-y-3">
              <Bar label="Reports" value="128" widthClass="w-[92%]" color="bg-accent" />
              <Bar label="Rescues" value="92" widthClass="w-[70%]" color="bg-secondary" />
              <Bar label="Active groups" value="14" widthClass="w-[32%]" color="bg-primary" />
            </div>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl bg-base/35 p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
      <p className="text-2xl font-extrabold text-primary">{value}</p>
      <p className="mt-1 text-sm text-neutral-700">{label}</p>
    </div>
  );
}

function Bar({ label, value, widthClass, color }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-neutral-800">{label}</span>
        <span className="font-semibold text-neutral-800">{value}</span>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-white/70 ring-1 ring-black/5">
        <div className={`h-3 rounded-full ${widthClass} ${color} transition-all`} />
      </div>
    </div>
  );
}
