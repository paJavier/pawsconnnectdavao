"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import VolunteerSignUp from "@/components/VolunteerSignUp";
import { getAuthErrorMessage } from "@/lib/authErrorMessage";
export default function VolunteerOrgsLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [signupOpen, setSignupOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/volunteer-orgs/dashboard");
        return;
      }
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setMessage({ type: "", text: "" });
      setLoading(true);
      await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      router.push("/volunteer-orgs/dashboard");
    } catch (error) {
      setMessage({ type: "error", text: getAuthErrorMessage(error, "Login failed. Please try again.") });
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grad-card-ngo p-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="grad-card-ngo grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <section className="grad-card p-6">
          <h1 className="text-2xl font-extrabold text-primary">Volunteer Partner Access</h1>
          <p className="mt-2 text-sm text-neutral-700">
            Continue to your dashboard by logging in, or create a new partner account to apply.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-800">
            <li>Login if you already registered</li>
            <li>Sign up to submit a new partner application</li>
            <li>Approval is required before full dashboard access</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSignupOpen(true)}
              className="grad-btn text-sm"
            >
              Sign up as partner
            </button>
            <Link
              href="/"
              className="grad-btn-soft text-sm"
            >
              Back to home
            </Link>
          </div>
        </section>

        <section className="grad-card p-6">
          <h2 className="text-xl font-extrabold text-primary">Login</h2>
          {message.text ? (
            <div
              className={`mt-3 rounded-xl p-3 text-sm ${
                message.type === "error"
                  ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                  : "bg-green-100 text-green-700 ring-1 ring-green-200"
              }`}
            >
              {message.text}
            </div>
          ) : null}
          <form onSubmit={handleLogin} className="mt-4 space-y-3">
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full rounded-xl border px-4 py-3"
            />
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full rounded-xl border px-4 py-3"
            />
            <button
              type="submit"
              disabled={loading}
              className="grad-btn w-full py-3 text-sm disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login to dashboard"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setSignupOpen(true)}
            className="mt-3 text-sm font-semibold text-secondary underline"
          >
            No account yet? Sign up
          </button>
        </section>
      </div>

      <VolunteerSignUp isOpen={signupOpen} onClose={() => setSignupOpen(false)} />
    </div>
  );
}
