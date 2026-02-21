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
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const sampleReports = [
    { id: "PC-00128", location: "2.2 km | High", submittedAgo: "10 mins" },
    { id: "PC-00126", location: "1.8 km | High", submittedAgo: "12 mins" },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/volunteer-orgs/login");
        return;
      }

      //  Check if admin 
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data()?.role === "admin") {
        setLoading(false);
        router.push("/admin");
        return;
      }

      //  Email verification gating (partners only)
      if (!user.emailVerified) {
        setEmailVerified(false);
        setLoading(false);
        return;
      }
      setEmailVerified(true);

      //  Check application status (partners)
      const snap = await getDoc(doc(db, "partnerApplications", user.uid));
      if (!snap.exists()) {
        setStatus("no_application");
        setLoading(false);
        return;
      }

      const data = snap.data();
      setAppData(data);
      setStatus((data.status || "pending").toString().trim().toLowerCase());
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
        <div className="grad-card-ngo p-8">
          Loading dashboard…
        </div>
      </div>
    );
  }

  // 1) Not verified email yet
  if (!emailVerified) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grad-card-ngo p-8">
          <h1 className="text-2xl font-extrabold text-primary">Verify your email</h1>
          <p className="mt-2 text-neutral-700">
            Please verify your email address to access the volunteer dashboard.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleResendVerification}
              disabled={sendingVerify}
              className="grad-btn text-sm disabled:opacity-60"
            >
              {sendingVerify ? "Sending…" : "Resend verification email"}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="grad-btn-soft text-sm text-secondary"
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
        <div className="grad-card-ngo p-8">
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
        <div className="grad-card-ngo p-8">
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
            {appData?.permitLink ? (
              <p className="mt-2">
                Proof link:{" "}
                <a
                  className="text-secondary underline"
                  href={appData.permitLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open proof
                </a>
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="grad-btn-soft text-sm text-secondary"
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
        <div className="grad-card-ngo p-8">
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
  
  //dashboard
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grad-card-ngo border border-amber-200 p-6 md:p-8">
        <h1 className="text-center text-2xl font-black uppercase tracking-[0.25em] text-amber-700 md:text-3xl">
          Volunteer Dashboard
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-700">
          Welcome, <span className="font-semibold">{appData?.organization}</span>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="grad-pill px-4 py-2 text-center text-sm font-bold text-neutral-900">Active</div>
          <div className="grad-pill px-4 py-2 text-center text-sm font-bold text-neutral-900">Pending</div>
          <div className="grad-pill px-4 py-2 text-center text-sm font-bold text-neutral-900">Resolved</div>
          <div className="grad-pill px-4 py-2 text-center text-sm font-bold text-neutral-900">Avg. Time</div>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-base/35 to-white p-4 ring-1 ring-black/5 md:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-white to-secondary/10 p-4 ring-1 ring-black/5">
              <h2 className="text-center text-lg font-bold text-neutral-900">Report List</h2>
              <div className="mt-4 space-y-3">
                {sampleReports.map((report) => (
                  <div key={report.id} className="rounded-xl bg-white/90 p-4 text-sm text-neutral-900">
                    <p>Ticket #{report.id}</p>
                    <p>{report.location}</p>
                    <p>Submitted {report.submittedAgo} ago</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-base/30 p-4 ring-1 ring-black/5">
              <h2 className="text-center text-lg font-bold text-neutral-900">Report Details</h2>
              <div className="mt-4 rounded-xl bg-white/80 p-5 text-center text-sm text-neutral-900">
                <p>Ticket ID</p>
                <p>Map Preview</p>
                <p>Description</p>
                <p>Photo</p>
                <p>Status</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="grad-btn flex-1 rounded-full px-4 py-2 text-sm font-bold">
                  Accept
                </button>
                <button className="grad-btn-soft flex-1 rounded-full px-4 py-2 text-sm font-bold text-secondary">
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/volunteer-orgs/dashboard/reports"
            className="grad-btn-soft px-4 py-2 text-sm text-secondary"
          >
            Open full reports
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="grad-btn-soft px-4 py-2 text-sm text-secondary"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
