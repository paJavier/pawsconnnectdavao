"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/authErrorMessage";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(Boolean(user));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const onOpenLogin = () => setIsLoginOpen(true);
    window.addEventListener("paws:open-login-modal", onOpenLogin);
    return () => window.removeEventListener("paws:open-login-modal", onOpenLogin);
  }, []);

  const closeLoginModal = () => {
    setIsLoginOpen(false);
    setLoginMessage("");
    setLoggingIn(false);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginMessage("");
      setLoggingIn(true);
      const cred = await signInWithEmailAndPassword(auth, loginForm.email.trim(), loginForm.password);
      const userSnap = await getDoc(doc(db, "users", cred.user.uid));
      const role = userSnap.exists() ? userSnap.data()?.role : null;
      closeLoginModal();
      router.push(role === "admin" ? "/admin" : "/volunteer-orgs/dashboard");
    } catch (error) {
      setLoginMessage(getAuthErrorMessage(error, "Login failed. Please try again."));
      setLoggingIn(false);
    }
  };

  const handleDashboardClick = (e) => {
    e.preventDefault();

    if (isLoggedIn) {
      router.push("/volunteer-orgs/dashboard");
      setOpen(false);
      return;
    }

    router.push("/volunteer-orgs/login");
    setOpen(false);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();

    if (isLoggedIn) {
      router.push("/volunteer-orgs/dashboard");
      setOpen(false);
      return;
    }

    if (pathname === "/") {
      setIsLoginOpen(true);
      setOpen(false);
      return;
    }

    router.push("/volunteer-orgs/login");
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      setIsLoginOpen(false);
      setOpen(false);
      if (pathname !== "/") router.push("/");
    } finally {
      setLoggingOut(false);
    }
  };

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
            href="/"
            className="grad-btn px-4 py-2 text-sm"
          >
            Home
          </Link>

          <Link
            href="/#about-us"
            className="grad-btn-soft px-4 py-2 text-sm"
          >
            About Us
          </Link>

          <Link
            href="/volunteer-orgs/dashboard"
            onClick={handleDashboardClick}
            className="grad-btn px-4 py-2 text-sm"
          >
            Dashboard
          </Link>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="grad-btn-soft px-4 py-2 text-sm text-secondary disabled:opacity-70"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          ) : (
            <Link
              href="/volunteer-orgs/login"
              onClick={handleLoginClick}
              className="grad-btn-soft px-4 py-2 text-sm text-secondary"
            >
              Login
            </Link>
          )}
          
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
              href="/"
              onClick={() => setOpen(false)}
              className="grad-btn px-4 py-2 text-sm"
            >
              Home
            </Link>

            <Link
              href="/#about-us"
              onClick={() => setOpen(false)}
              className="grad-btn-soft px-4 py-2 text-sm"
            >
              About Us
            </Link>

            <Link
              href="/volunteer-orgs/dashboard"
              onClick={handleDashboardClick}
              className="grad-btn px-4 py-2 text-sm"
            >
              Dashboard
            </Link>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="grad-btn-soft px-4 py-2 text-sm text-secondary disabled:opacity-70"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            ) : (
              <Link
                href="/volunteer-orgs/login"
                onClick={handleLoginClick}
                className="grad-btn-soft px-4 py-2 text-sm text-secondary"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}

      {isMounted && isLoginOpen
        ? createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4">
          <div className="grad-card-ngo relative w-full max-w-md p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeLoginModal}
              className="absolute right-4 top-3 text-2xl text-neutral-500 hover:text-neutral-700"
              aria-label="Close"
            >
              ×
            </button>

            <h3 className="text-2xl font-extrabold text-primary">Volunteer Login</h3>
            <p className="mt-2 text-sm text-neutral-700">
              Access your volunteer dashboard and manage active cases.
            </p>

            {isLoggedIn ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-green-100 p-3 text-sm text-green-800 ring-1 ring-green-200">
                  You are already signed in.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeLoginModal();
                    router.push("/volunteer-orgs/dashboard");
                  }}
                  className="grad-btn w-full text-center"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="grad-btn-soft w-full text-center text-secondary disabled:opacity-70"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : (
              <>
                {loginMessage ? (
                  <div className="mt-4 rounded-xl bg-red-100 p-3 text-sm text-red-700 ring-1 ring-red-200">
                    {loginMessage}
                  </div>
                ) : null}

                <form onSubmit={handleLogin} className="mt-5 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="Enter your email"
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/95 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="Enter your password"
                    className="mt-1 w-full rounded-xl border border-black/10 bg-white/95 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
                      required
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

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="grad-btn w-full text-center disabled:opacity-70"
                  >
                    {loggingIn ? "Logging in..." : "Log In"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      , document.body)
        : null}
    </header>
  );
}
