"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import VolunteerSignUp from "@/components/VolunteerSignUp";
import { auth } from "@/lib/firebase";


const partnerGroups = [
  { name: "Happy Animals Club", logo: "/images/partners/partner2.png" },
  { name: "Bantay Hayop Davao", logo: "/images/partners/partner1.jpg" },
  { name: "Davao Animal Rescue Volunteers", logo: "/images/partners/partner3.jpg" },
  { name: "ARRF-Davao Inc", logo: "/images/partners/partner4.jpg" },
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
export default function Home() {
  const router = useRouter();
  const parallaxY = useParallax(0.22);

  const [isPartnerSignupOpen, setIsPartnerSignupOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const openPartnerSignup = () => setIsPartnerSignupOpen(true);
  const closePartnerSignup = () => setIsPartnerSignupOpen(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(Boolean(user));
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
    } finally {
      setLoggingOut(false);
    }
  };

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


        {/* Hero content */}
        <div className="relative z-20 mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-5 md:items-start">
            {/* LEFT */}
            <div className="animate-fadeUp md:col-span-3">
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
              <div className="grad-card mt-10 p-8 backdrop-blur-sm">
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

              {/* Grid */}
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {partnerGroups.map((p) => (
                    <div
                      key={p.name}
                      className="group flex flex-col items-center text-center"
                    >
                      {/* Logo Square */}
                      <div className="relative aspect-square w-full max-w-[150px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition group-hover:-translate-y-1 group-hover:shadow-md">
                        <Image
                          src={p.logo}
                          alt={p.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                        />
                      </div>

                      {/* Name Below */}
                      <p className="mt-3 text-sm font-semibold text-neutral-900">
                        {p.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/how-it-works"
                    className="grad-btn px-4 py-2 text-sm"
                  >
                    How PawsConnect works
                  </Link>

                  <Link
                    href="/partners"
                    className="grad-btn-soft px-4 py-2 text-sm text-secondary"
                  >
                    Meet our partners
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <aside className="animate-fadeUp delay-100 space-y-4 md:col-span-2">
              <div className="grad-card-ngo p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-primary">
                    {isLoggedIn ? "You Are Signed In" : "Volunteers & Groups"}
                  </h2>
                  <span className="grad-pill">
                    {isLoggedIn ? "Session Active" : "Protected"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-neutral-700">
                  {isLoggedIn
                    ? "Access your dashboard to manage alerts, case updates, and partner activity."
                    : "Volunteer accounts receive alerts and manage rescue cases in the dashboard."}
                </p>

                {isLoggedIn ? (
                  <div className="mt-6 grid gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/volunteer-orgs/dashboard")}
                      className="grad-btn text-center"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="grad-btn-soft text-center text-secondary disabled:opacity-70"
                    >
                      {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                    <div className="rounded-2xl bg-base/40 p-4 text-xs text-neutral-800">
                      <p className="font-semibold">Dashboard access is active.</p>
                      <p className="mt-1">
                        Your session is verified for volunteer tools and case management.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3">
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent("paws:open-login-modal"))}
                      className="grad-btn text-center"
                    >
                      Log In
                    </button>
                    <div className="text-center text-xs text-neutral-700">
                      Need an account?{" "}
                      <button
                        type="button"
                        onClick={openPartnerSignup}
                        className="font-semibold text-primary underline decoration-primary/50 underline-offset-4 hover:decoration-primary"
                      >
                        Sign up
                      </button>
                    </div>
                    <div className="rounded-2xl bg-base/40 p-4 text-xs text-neutral-800">
                      <p className="font-semibold">Dashboard access is restricted.</p>
                      <p className="mt-1">
                        Only verified volunteer groups can accept and update cases.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Become a Partner CTA */}
              <div className="grad-card p-6 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-primary">
                  Want to help more strays?
                </h3>

                <p className="mt-2 text-sm text-neutral-700">
                  If you are part of a rescue group or animal welfare organization,
                  apply to become a verified partner and start receiving local stray reports.
                </p>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={openPartnerSignup}
                    className="grad-btn inline-flex items-center justify-center text-sm"
                  >
                    Become a Partner →
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
      {/* IMPACT (Reveal on scroll) */}
      <Reveal className="mx-auto mt-20 max-w-6xl px-6 pb-16">
        <div className="grad-card p-7">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-2xl font-extrabold text-primary">
                Our Community Impact
              </h3>
              <p className="text-sm text-neutral-700">
                Prototype metrics for demonstration (will update with real usage data).
              </p>
            </div>

            <div className="grad-pill inline-flex items-center gap-2 px-4 py-2">
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

      <section id="about-us" className="mx-auto max-w-6xl px-6 pb-16 scroll-mt-28">
        <div className="grad-card p-7">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-secondary">
            About PawsConnect Davao
          </span>

          <h3 className="mt-4 text-3xl font-extrabold text-primary">
            Built for community rescue response
          </h3>

          <p className="mt-3 max-w-3xl text-secondary">
            PawsConnect Davao helps residents, volunteers, and partner organizations work together
            for faster and safer stray animal response. We focus on verified reporting workflows,
            protected volunteer tools, and transparent case updates.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="grad-card p-6">
            <h4 className="text-lg font-extrabold text-primary">Our mission</h4>
            <p className="mt-2 text-sm text-secondary">
              Make reporting easier and rescue coordination faster, while keeping data quality high.
            </p>
          </div>

          <div className="grad-card p-6">
            <h4 className="text-lg font-extrabold text-primary">How we work</h4>
            <p className="mt-2 text-sm text-secondary">
              Residents submit reports, verified volunteers receive alerts, and partner groups
              manage updates in one workflow.
            </p>
          </div>

          <div className="grad-card p-6">
            <h4 className="text-lg font-extrabold text-primary">Why it matters</h4>
            <p className="mt-2 text-sm text-secondary">
              Better coordination improves response speed and increases the number of successful
              rescue outcomes.
            </p>
          </div>
        </div>
      </section>

      <VolunteerSignUp isOpen={isPartnerSignupOpen} onClose={closePartnerSignup} />
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

