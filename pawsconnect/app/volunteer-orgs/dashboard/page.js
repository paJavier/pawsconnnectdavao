"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // pending | approved | rejected | no_application
  const [appData, setAppData] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isActiveResponder, setIsActiveResponder] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/volunteer-orgs/login");
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists() && userSnap.data()?.role === "admin") {
        setLoading(false);
        router.push("/admin");
        return;
      }

      if (!user.emailVerified) {
        setEmailVerified(false);
        setLoading(false);
        return;
      }
      setEmailVerified(true);

      const snap = await getDoc(doc(db, "partnerApplications", user.uid));
      if (!snap.exists()) {
        setStatus("no_application");
        setLoading(false);
        return;
      }

      const data = snap.data();
      setAppData(data);
      setStatus((data.status || "pending").toString().trim().toLowerCase());
      setIsActiveResponder(Boolean(data.isActiveResponder));
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (status !== "approved" || !emailVerified || !isActiveResponder) {
      setReports([]);
      setSelectedReport(null);
      return;
    }

    const q = query(
      collection(db, "reports"),
      where("status", "==", "PENDING"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReports(items);
        setSelectedReport((prev) => {
          if (!items.length) return null;
          if (!prev) return items[0];
          return items.find((item) => item.id === prev.id) || items[0];
        });
      },
      (err) => {
        console.error("Failed to load reports:", err);
      }
    );

    return () => unsub();
  }, [status, emailVerified, isActiveResponder]);

  const handleToggleAvailability = async () => {
    const user = auth.currentUser;
    if (!user || status !== "approved") return;

    const nextValue = !isActiveResponder;
    try {
      setSavingAvailability(true);
      await updateDoc(doc(db, "partnerApplications", user.uid), {
        isActiveResponder: nextValue,
        updatedAt: serverTimestamp(),
      });
      setIsActiveResponder(nextValue);
      setAppData((prev) => (prev ? { ...prev, isActiveResponder: nextValue } : prev));
    } catch (e) {
      alert(e.message || "Failed to update availability.");
    } finally {
      setSavingAvailability(false);
    }
  };

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
        <div className="grad-card-ngo p-8">Loading dashboard...</div>
      </div>
    );
  }

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
              {sendingVerify ? "Sending..." : "Resend verification email"}
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

  if (status === "no_application") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grad-card-ngo p-8">
          <h1 className="text-2xl font-extrabold text-primary">No application found</h1>
          <p className="mt-2 text-neutral-700">
            Your account exists, but we cannot find your partner application.
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

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grad-card-ngo p-8">
          <h1 className="text-2xl font-extrabold text-primary">Application Pending</h1>
          <p className="mt-2 text-neutral-700">
            Thanks, <span className="font-semibold">{appData?.organization}</span>. Your application is currently under review. You will get full dashboard access once approved.
          </p>

          <div className="mt-6 rounded-2xl bg-base/40 p-5 text-sm text-neutral-800">
            <p className="font-semibold">Restricted access</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You can view your submitted details</li>
              <li>You cannot accept or update cases yet</li>
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grad-card-ngo border border-amber-200 p-6 md:p-8">
        <h1 className="text-center text-2xl font-black uppercase tracking-[0.25em] text-amber-700 md:text-3xl">
          Volunteer Dashboard
        </h1>
        <p className="mt-2 text-center text-sm text-neutral-700">
          Welcome, <span className="font-semibold">{appData?.organization}</span>
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
          <span className="text-sm font-semibold text-neutral-800">Availability</span>
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={savingAvailability}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              isActiveResponder
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
            }`}
          >
            {savingAvailability
              ? "Saving..."
              : isActiveResponder
                ? "Active (Receiving Reports)"
                : "Inactive (Paused)"}
          </button>
          <p className="w-full text-center text-xs text-neutral-600">
            Only verified and approved accounts marked active should receive pending reports.
          </p>
        </div>

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
                {!isActiveResponder ? (
                  <div className="rounded-xl bg-white/90 p-4 text-sm text-neutral-700 ring-1 ring-black/5">
                    Set your availability to Active to receive pending reports.
                  </div>
                ) : reports.length ? (
                  reports.map((report) => (
                    <button
                      type="button"
                      key={report.ticketId || report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full rounded-xl p-4 text-left text-sm ring-1 ring-black/5 transition ${
                        selectedReport?.id === report.id ? "bg-secondary/10" : "bg-white/90 hover:bg-white"
                      }`}
                    >
                      <p className="font-semibold">Ticket #{report.ticketId || report.id}</p>
                      <p className="text-neutral-700">
                        {report.urgency || "LOW"} | {report.address || `${report.lat ?? "-"}, ${report.lng ?? "-"}`}
                      </p>
                      <p className="text-xs text-neutral-500">Status: {report.status || "PENDING"}</p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl bg-white/90 p-4 text-sm text-neutral-700 ring-1 ring-black/5">
                    No pending reports right now.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-base/30 p-4 ring-1 ring-black/5">
              <h2 className="text-center text-lg font-bold text-neutral-900">Report Details</h2>
              <div className="mt-4 rounded-xl bg-white/80 p-5 text-sm text-neutral-900">
                {selectedReport ? (
                  <>
                    <p className="font-semibold">Ticket: {selectedReport.ticketId || selectedReport.id}</p>
                    <p className="mt-2">
                      <span className="font-semibold">Urgency:</span> {selectedReport.urgency || "LOW"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold">Location:</span>{" "}
                      {selectedReport.address || `${selectedReport.lat ?? "-"}, ${selectedReport.lng ?? "-"}`}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold">Description:</span>{" "}
                      {selectedReport.description || "No description provided."}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold">Status:</span> {selectedReport.status || "PENDING"}
                    </p>

                    {selectedReport.photoUrl ? (
                      <img
                        src={selectedReport.photoUrl}
                        alt="Report"
                        className="mt-3 h-48 w-full rounded-xl object-cover ring-1 ring-black/10"
                      />
                    ) : (
                      <p className="mt-3 text-xs text-neutral-600">No photo attached.</p>
                    )}
                  </>
                ) : (
                  <p className="text-neutral-700">
                    {isActiveResponder
                      ? "No pending reports right now."
                      : "Activate availability to start receiving reports."}
                  </p>
                )}
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
