"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function VolunteerSignUp({ isOpen, onClose }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    phone: "",
    password: "",
    permitLink: "", // ✅ added
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.permitLink.trim()) {
      setErrorMessage("Please paste a permit/proof link (e.g., Google Drive link).");
      return;
    }

    try {
      setErrorMessage("");
      setLoading(true);

      // 1) Create Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // 2) Send email verification
      await sendEmailVerification(user);

      // 3) Save application to Firestore
      await setDoc(doc(db, "partnerApplications", user.uid), {
        fullName: form.fullName,
        organization: form.organization,
        email: form.email,
        phone: form.phone,
        permitLink: form.permitLink,
        status: "pending",
        role: "partner",
        uid: user.uid,
        createdAt: serverTimestamp(),
      });

      setSuccessMessage("Application submitted! Redirecting to dashboard…");

      // 4) Close + redirect (ONLY ONCE)
      setTimeout(() => {
        onClose?.();
        router.push("/volunteer-orgs/dashboard");
      }, 1200);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Failed to submit application.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 text-2xl text-neutral-500 hover:text-neutral-700"
          aria-label="Close"
        >
          ×
        </button>

        <h3 className="text-2xl font-extrabold text-primary">
          Become a Verified Partner
        </h3>

        {successMessage ? (
          <div className="mt-5 rounded-xl bg-green-100 p-4 text-green-800">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {errorMessage ? (
              <div className="rounded-xl bg-red-100 p-3 text-sm text-red-700 ring-1 ring-red-200">
                {errorMessage}
              </div>
            ) : null}
            <input
              type="text"
              name="fullName"
              required
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="text"
              name="organization"
              required
              placeholder="Organization Name"
              value={form.organization}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="email"
              name="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="tel"
              name="phone"
              required
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="password"
              name="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <div>
              <label className="text-sm font-semibold">
                Permit / Proof Link (Google Drive, FB Page, Website)
              </label>
              <input
                type="url"
                name="permitLink"
                required
                placeholder="https://drive.google.com/…"
                value={form.permitLink}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border px-4 py-3"
              />
              <p className="mt-1 text-xs text-neutral-600">
                Tip: Make sure the link is accessible to viewers.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
