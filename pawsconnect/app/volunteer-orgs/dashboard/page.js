"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // "pending" | "approved" | "rejected" | null
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/"); // or /volunteer-orgs/login
        return;
      }

      // OPTIONAL: require email verification before dashboard access
      if (!user.emailVerified) {
        setStatus("needs_verification");
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "partnerApplications", user.uid));
      if (!snap.exists()) {
        setStatus("no_application");
        setLoading(false);
        return;
      }

      const data = snap.data();
      setAppData(data);
      setStatus(data.status); // "pending" | "approved" | "rejected"
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return <div className="p-10">Loading dashboard…</div>;
  }

  // 1) Email not verified
  if (status === "needs_verification") {
    return (
      <div className="mx-auto max-w-xl p-8">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-bold text-primary">Verify your email</h1>
          <p className="mt-2 text-neutral-700">
            Please verify your email address to continue. Check your inbox and spam folder.
          </p>
        </div>
      </div>
    );
  }

  // 2) No application found
  if (status === "no_application") {
    return (
      <div className="mx-auto max-w-xl p-8">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-bold text-primary">No application found</h1>
          <p className="mt-2 text-neutral-700">
            Please submit a partner application first.
          </p>
        </div>
      </div>
    );
  }

  // 3) Pending
  if (status === "pending") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-bold text-primary">Application Pending</h1>
          <p className="mt-2 text-neutral-700">
            Thanks, {appData?.organization}! Your application is under review.
            You’ll get access once approved.
          </p>

          <div className="mt-6 rounded-2xl bg-base/40 p-5 text-sm text-neutral-800">
            <p className="font-semibold">Restricted access</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You can view your application details</li>
              <li>You can’t accept or update rescue cases yet</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 4) Rejected
  if (status === "rejected") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-3xl bg-white p-8 shadow ring-1 ring-black/5">
          <h1 className="text-2xl font-bold text-primary">Application not approved</h1>
          <p className="mt-2 text-neutral-700">
            Your application was not approved. You may contact the team or reapply with updated documents.
          </p>
        </div>
      </div>
    );
  }

  // 5) Approved → Real dashboard
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-primary">Volunteer Dashboard</h1>
      <p className="mt-2 text-neutral-700">
        Welcome, {appData?.organization}! You can now accept and manage cases.
      </p>

      {/* Your real dashboard UI here */}
    </div>
  );
}
