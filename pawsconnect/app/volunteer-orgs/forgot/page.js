"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/authErrorMessage";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      await sendPasswordResetEmail(auth, trimmedEmail);
      setMessage({
        type: "success",
        text: "Password reset email sent. Check your inbox and spam folder.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getAuthErrorMessage(error, "Failed to send reset email. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="grad-card-ngo p-6 md:p-8">
        <h1 className="text-2xl font-extrabold text-primary">Forgot Password</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Enter your account email and we will send a password reset link.
        </p>

        {message.text ? (
          <div
            className={`mt-4 rounded-xl p-3 text-sm ${
              message.type === "error"
                ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                : "bg-green-100 text-green-700 ring-1 ring-green-200"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full rounded-xl border border-black/10 bg-white/95 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
          />

          <button
            type="submit"
            disabled={loading}
            className="grad-btn w-full py-3 text-sm disabled:opacity-60"
          >
            {loading ? "Sending reset email..." : "Send reset email"}
          </button>
        </form>

        <Link href="/volunteer-orgs/login" className="mt-4 inline-block text-sm font-semibold text-secondary underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
