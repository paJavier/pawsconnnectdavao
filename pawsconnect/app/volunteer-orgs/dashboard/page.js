"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // pending | approved | rejected | no_application
  const [appData, setAppData] = useState(null);
  const [emailVerified, setEmailVerified] = useState(true);
  const [sendingVerify, setSendingVerify] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/volunteer-orgs/login");
        return;
      }

      // Email verification gating (you wanted this)
      if (!user.emailVerified) {
        setEmailVerified(false);
        setLoading(false);
        return;
      }
      setEmailVerified(true);

      // Check application status
      const snap = await getDoc(doc(db, "partnerApplications", user.uid));
      if (!snap.exists()) {
        setStatus("no_application");
        setLoading(false);
        return;
      }

      const data = snap.data();
      setAppData(data);
      setStatus(data.status || "pending");
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const handleResendVerification = async () => {
    try {
      setSendingVerify(true);
      const user = auth.currentUser;
      if (!user) return;
      await sendEmailVerification(user);
      alert("Verification email sent. Please check your inbox/spam.");
    } catch (e) {
      alert(e.message);
    } finally {
      setSendingVerify(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          Loading dashboard…
        </div>
      </div>
    );
  }

  // 1) Not verified email yet
  if (!emailVerified) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-extrabold text-primary">Verify your email</h1>
          <p className="mt-2 text-neutral-700">
            Please verify your email address to access the volunteer dashboard.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleResendVerification}
              disabled={sendingVerify}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            >
              {sendingVerify ? "Sending…" : "Resend verification email"}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-secondary ring-2 ring-secondary/20 transition hover:-translate-y-0.5 hover:ring-secondary/40"
            >
              I already verified (Refresh)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2) No application found
  if (status === "no_application") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-extrabold text-primary">No application found</h1>
          <p className="mt-2 text-neutral-700">
            Your account exists, but we can’t find your partner application.
          </p>
          <div className="mt-6">
            <Link className="font-semibold text-secondary underline" href="/">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3) Pending restriction view
  if (status === "pending") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-extrabold text-primary">Application Pending</h1>
          <p className="mt-2 text-neutral-700">
            Thanks, <span className="font-semibold">{appData?.organization}</span>. Your application is
            currently under review. You’ll get full dashboard access once approved.
          </p>

          <div className="mt-6 rounded-2xl bg-base/40 p-5 text-sm text-neutral-800">
            <p className="font-semibold">Restricted access</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You can view your submitted details</li>
              <li>You can’t accept or update cases yet</li>
            </ul>
          </div>

          <div className="mt-6 text-sm text-neutral-700">
            <p className="font-semibold">Your submission</p>
            <p className="mt-1">Organization: {appData?.organization}</p>
            <p>Email: {appData?.email}</p>
            <p>Phone: {appData?.phone}</p>
            {appData?.permitUrl ? (
              <p className="mt-2">
                Proof:{" "}
                <a className="text-secondary underline" href={appData.permitUrl} target="_blank">
                  View uploaded file
                </a>
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-secondary ring-2 ring-secondary/20 transition hover:-translate-y-0.5 hover:ring-secondary/40"
            >
              Refresh status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4) Rejected view
  if (status === "rejected") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-extrabold text-primary">Application Not Approved</h1>
          <p className="mt-2 text-neutral-700">
            Your partner application was not approved. You can contact the team or reapply with updated documents.
          </p>
          <div className="mt-6">
            <Link className="font-semibold text-secondary underline" href="/">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5) Approved → real dashboard
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
        <h1 className="text-3xl font-extrabold text-primary">Volunteer Dashboard</h1>
        <p className="mt-2 text-neutral-700">
          Welcome, <span className="font-semibold">{appData?.organization}</span>. You can now accept and manage cases.
        </p>

        {/* TODO: put your real dashboard features here */}
        <div className="mt-8 rounded-2xl bg-base/40 p-6">
          <p className="font-semibold text-neutral-900">Next features to add:</p>
          <ul className="mt-2 list-disc pl-5 text-neutral-800">
            <li>Incoming reports queue</li>
            <li>Accept case</li>
            <li>Update status (en route, rescued, completed)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
