"use client";

import { useEffect, useMemo, useState } from "react";
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

function toMillis(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") {
    return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
  }
  return null;
}

function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatDurationLabel(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "--";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function average(numbers) {
  if (!numbers.length) return null;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function formatDateTime(ts) {
  const ms = toMillis(ts);
  if (!ms) return "N/A";
  return new Date(ms).toLocaleString();
}

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // pending | approved | rejected | no_application
  const [appData, setAppData] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);

  const [pendingReports, setPendingReports] = useState([]);
  const [assignedAcceptedReports, setAssignedAcceptedReports] = useState([]);
  const [resolvedReports, setResolvedReports] = useState([]);

  const [reportView, setReportView] = useState("pending"); // pending | active | resolved
  const [selectedReport, setSelectedReport] = useState(null);

  const [isActiveResponder, setIsActiveResponder] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [savingReportAction, setSavingReportAction] = useState(false);
  const [reportActionMessage, setReportActionMessage] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());
  const [isFullReportOpen, setIsFullReportOpen] = useState(false);

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
    const user = auth.currentUser;
    if (status !== "approved" || !emailVerified || !user) {
      setPendingReports([]);
      setAssignedAcceptedReports([]);
      setResolvedReports([]);
      return;
    }

    let unsubPending = null;
    if (isActiveResponder) {
      const pendingQ = query(
        collection(db, "reports"),
        where("status", "==", "PENDING"),
        orderBy("createdAt", "desc")
      );
      unsubPending = onSnapshot(
        pendingQ,
        (snap) => setPendingReports(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => console.error("Failed to load pending reports:", err)
      );
    } else {
      setPendingReports([]);
    }

    const assignedQ = query(
      collection(db, "reports"),
      where("assignedVolunteerUid", "==", user.uid)
    );

    const unsubAssigned = onSnapshot(
      assignedQ,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssignedAcceptedReports(
          docs.filter((r) => (r.status || "").toString().trim().toUpperCase() === "ACCEPTED")
        );
        setResolvedReports(
          docs.filter((r) => (r.status || "").toString().trim().toUpperCase() === "RESOLVED")
        );
      },
      (err) => console.error("Failed to load assigned reports:", err)
    );

    return () => {
      if (typeof unsubPending === "function") unsubPending();
      unsubAssigned();
    };
  }, [status, emailVerified, isActiveResponder]);

  const displayedReports = useMemo(() => {
    if (reportView === "active") {
      return [...assignedAcceptedReports].sort((a, b) => (b?.acceptedAt?.seconds || 0) - (a?.acceptedAt?.seconds || 0));
    }
    if (reportView === "resolved") {
      return [...resolvedReports].sort((a, b) => (b?.resolvedAt?.seconds || 0) - (a?.resolvedAt?.seconds || 0));
    }
    return [...pendingReports].sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
  }, [reportView, assignedAcceptedReports, resolvedReports, pendingReports]);

  useEffect(() => {
    setSelectedReport((prev) => {
      if (!displayedReports.length) return null;
      if (!prev) return displayedReports[0];
      return displayedReports.find((r) => r.id === prev.id) || displayedReports[0];
    });
  }, [displayedReports]);

  useEffect(() => {
    if (!selectedReport || (selectedReport.status || "").toString().toUpperCase() !== "ACCEPTED") return;
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [selectedReport]);

  useEffect(() => {
    if (!selectedReport) setIsFullReportOpen(false);
  }, [selectedReport]);

  const resolvedAvgMs = useMemo(() => {
    const durations = resolvedReports
      .map((r) => {
        const created = toMillis(r.createdAt);
        const resolved = toMillis(r.resolvedAt);
        return created && resolved && resolved >= created ? resolved - created : null;
      })
      .filter((v) => Number.isFinite(v));
    return average(durations);
  }, [resolvedReports]);

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
      if (!nextValue && reportView === "pending") setReportView("active");
      if (nextValue && !pendingReports.length && reportView !== "active") setReportView("pending");
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

  const handleAcceptReport = async () => {
    const user = auth.currentUser;
    if (!user || !selectedReport?.id) return;

    try {
      setSavingReportAction(true);
      setReportActionMessage("");
      await updateDoc(doc(db, "reports", selectedReport.id), {
        status: "ACCEPTED",
        assignedVolunteerUid: user.uid,
        assignedOrganization: appData?.organization || "",
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReportActionMessage("Report accepted. Response timer started.");
      setReportView("active");
    } catch (e) {
      setReportActionMessage(e?.message || "Failed to accept report.");
    } finally {
      setSavingReportAction(false);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport?.id) return;

    try {
      setSavingReportAction(true);
      setReportActionMessage("");
      await updateDoc(doc(db, "reports", selectedReport.id), {
        status: "RESOLVED",
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setReportActionMessage("Report marked as resolved.");
      setReportView("resolved");
    } catch (e) {
      setReportActionMessage(e?.message || "Failed to resolve report.");
    } finally {
      setSavingReportAction(false);
    }
  };

  const handleReassignReport = async () => {
    if (!selectedReport?.id) return;

    try {
      setSavingReportAction(true);
      setReportActionMessage("");
      await updateDoc(doc(db, "reports", selectedReport.id), {
        status: "PENDING",
        assignedVolunteerUid: null,
        assignedOrganization: null,
        acceptedAt: null,
        updatedAt: serverTimestamp(),
      });
      setReportActionMessage("Report returned to pending queue.");
      if (isActiveResponder) setReportView("pending");
    } catch (e) {
      setReportActionMessage(e?.message || "Failed to reassign report.");
    } finally {
      setSavingReportAction(false);
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
          <p className="mt-2 text-neutral-700">Your account exists, but we cannot find your partner application.</p>
          <div className="mt-6">
            <Link className="font-semibold text-secondary underline" href="/">Go back home</Link>
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
              <p className="mt-2">Proof link: <a className="text-secondary underline" href={appData.permitLink} target="_blank" rel="noreferrer">Open proof</a></p>
            ) : null}
          </div>
          <div className="mt-6">
            <button onClick={() => window.location.reload()} className="grad-btn-soft text-sm text-secondary">Refresh status</button>
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
          <p className="mt-2 text-neutral-700">Your partner application was not approved. You can contact the team or reapply with updated documents.</p>
          <div className="mt-6">
            <Link className="font-semibold text-secondary underline" href="/">Go back home</Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedStatus = (selectedReport?.status || "").toString().toUpperCase();
  const acceptedAtMs = toMillis(selectedReport?.acceptedAt);
  const liveTimer = selectedStatus === "ACCEPTED" && acceptedAtMs ? formatElapsed(nowTick - acceptedAtMs) : null;

  const tabBtn = (key, label, count, disabled = false) => (
    <button
      type="button"
      onClick={() => !disabled && setReportView(key)}
      disabled={disabled}
      className={`grad-pill px-4 py-2 text-center text-sm font-bold transition ${
        reportView === key ? "ring-2 ring-primary/40" : ""
      } ${disabled ? "opacity-50" : "hover:-translate-y-0.5"}`}
    >
      <div>{label}</div>
      <div className="text-xs font-semibold text-neutral-700">{count}</div>
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grad-card-ngo border border-amber-200 p-6 md:p-8">
        <h1 className="text-center text-2xl font-black uppercase tracking-[0.25em] text-amber-700 md:text-3xl">Volunteer Dashboard</h1>
        <p className="mt-2 text-center text-sm text-neutral-700">Welcome, <span className="font-semibold">{appData?.organization}</span></p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
          <span className="text-sm font-semibold text-neutral-800">Availability</span>
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={savingAvailability}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
              isActiveResponder ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300"
            }`}
          >
            {savingAvailability ? "Saving..." : isActiveResponder ? "Active (Receiving Reports)" : "Inactive (Paused)"}
          </button>
          <p className="w-full text-center text-xs text-neutral-600">Only verified and approved accounts marked active should receive pending reports.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {tabBtn("active", "Active", assignedAcceptedReports.length)}
          {tabBtn("pending", "Pending", pendingReports.length, !isActiveResponder)}
          {tabBtn("resolved", "Resolved", resolvedReports.length)}
          <button
            type="button"
            onClick={() => setReportView("resolved")}
            className="grad-pill px-4 py-2 text-center text-sm font-bold transition hover:-translate-y-0.5"
          >
            <div>Avg. Time</div>
            <div className="text-xs font-semibold text-neutral-700">{formatDurationLabel(resolvedAvgMs)}</div>
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-br from-base/35 to-white p-4 ring-1 ring-black/5 md:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gradient-to-br from-white to-secondary/10 p-4 ring-1 ring-black/5">
              <h2 className="text-center text-lg font-bold text-neutral-900">{reportView === "active" ? "Active Cases" : reportView === "resolved" ? "Resolved Cases" : "Pending Reports"}</h2>
              <div className="mt-4 space-y-3">
                {!isActiveResponder && reportView === "pending" ? (
                  <div className="rounded-xl bg-white/90 p-4 text-sm text-neutral-700 ring-1 ring-black/5">Set your availability to Active to receive pending reports.</div>
                ) : displayedReports.length ? (
                  displayedReports.map((report) => {
                    const reportStatus = (report.status || "PENDING").toString().toUpperCase();
                    const statusPill =
                      reportStatus === "ACCEPTED"
                        ? "bg-amber-100 text-amber-800"
                        : reportStatus === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800";

                    return (
                      <button
                        type="button"
                        key={report.ticketId || report.id}
                        onClick={() => setSelectedReport(report)}
                        className={`w-full rounded-xl p-4 text-left text-sm ring-1 ring-black/5 transition ${
                          selectedReport?.id === report.id ? "bg-secondary/10" : "bg-white/90 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">Ticket #{report.ticketId || report.id}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusPill}`}>{reportStatus}</span>
                        </div>
                        <p className="mt-1 text-neutral-700">{report.urgency || "LOW"} | {report.address || `${report.lat ?? "-"}, ${report.lng ?? "-"}`}</p>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl bg-white/90 p-4 text-sm text-neutral-700 ring-1 ring-black/5">No {reportView} reports right now.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-white to-base/30 p-4 ring-1 ring-black/5">
              <h2 className="text-center text-lg font-bold text-neutral-900">Report Details</h2>
              <div className="mt-4 rounded-xl bg-white/80 p-5 text-sm text-neutral-900">
                {selectedReport ? (
                  <>
                    <p className="font-semibold">Ticket: {selectedReport.ticketId || selectedReport.id}</p>
                    <p className="mt-2"><span className="font-semibold">Urgency:</span> {selectedReport.urgency || "LOW"}</p>
                    <p className="mt-2"><span className="font-semibold">Location:</span> {selectedReport.address || `${selectedReport.lat ?? "-"}, ${selectedReport.lng ?? "-"}`}</p>
                    <p className="mt-2"><span className="font-semibold">Description:</span> {selectedReport.description || "No description provided."}</p>
                    <p className="mt-2"><span className="font-semibold">Status:</span> {selectedStatus || "PENDING"}</p>

                    {liveTimer ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                        Timer since accepted: {liveTimer}
                      </p>
                    ) : null}

                    {selectedStatus === "RESOLVED" ? (
                      <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                        Resolution time: {formatDurationLabel((() => {
                          const c = toMillis(selectedReport.createdAt);
                          const r = toMillis(selectedReport.resolvedAt);
                          return c && r && r >= c ? r - c : null;
                        })())}
                      </p>
                    ) : null}

                    {selectedReport.photoUrl ? (
                      <img src={selectedReport.photoUrl} alt="Report" className="mt-3 h-48 w-full rounded-xl object-cover ring-1 ring-black/10" />
                    ) : (
                      <p className="mt-3 text-xs text-neutral-600">No photo attached.</p>
                    )}
                  </>
                ) : (
                  <p className="text-neutral-700">Select a report to view details.</p>
                )}
              </div>

              {reportActionMessage ? (
                <p className="mt-3 rounded-lg bg-white/80 p-2 text-xs text-neutral-700 ring-1 ring-black/5">{reportActionMessage}</p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleAcceptReport}
                  disabled={!selectedReport || selectedStatus !== "PENDING" || !isActiveResponder || savingReportAction}
                  className="grad-btn rounded-full px-4 py-2 text-sm font-bold disabled:opacity-60"
                >
                  {savingReportAction && selectedStatus === "PENDING" ? "Saving..." : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={handleResolveReport}
                  disabled={!selectedReport || selectedStatus !== "ACCEPTED" || savingReportAction}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {savingReportAction && selectedStatus === "ACCEPTED" ? "Saving..." : "Resolve"}
                </button>
                <button
                  type="button"
                  onClick={handleReassignReport}
                  disabled={!selectedReport || selectedStatus !== "ACCEPTED" || savingReportAction}
                  className="grad-btn-soft rounded-full px-4 py-2 text-sm font-bold text-secondary disabled:opacity-60"
                >
                  Reassign
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsFullReportOpen(true)}
            disabled={!selectedReport}
            className="grad-btn-soft px-4 py-2 text-sm text-secondary disabled:opacity-60"
          >
            Open full report
          </button>
          <button onClick={() => window.location.reload()} className="grad-btn-soft px-4 py-2 text-sm text-secondary">Refresh</button>
        </div>
      </div>

      {isFullReportOpen && selectedReport ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="grad-card-ngo relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 md:p-7">
            <button
              type="button"
              onClick={() => setIsFullReportOpen(false)}
              className="absolute right-4 top-3 text-2xl text-neutral-500 hover:text-neutral-700"
              aria-label="Close full report"
            >
              ×
            </button>

            <h2 className="text-2xl font-extrabold text-primary">Full Report</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Ticket #{selectedReport.ticketId || selectedReport.id}
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-white/80 p-4 text-sm ring-1 ring-black/10">
              <p><span className="font-semibold">Status:</span> {(selectedReport.status || "PENDING").toString().toUpperCase()}</p>
              <p><span className="font-semibold">Urgency:</span> {(selectedReport.urgency || "LOW").toString().toUpperCase()}</p>
              <p><span className="font-semibold">Address:</span> {selectedReport.address || "N/A"}</p>
              <p><span className="font-semibold">Coordinates:</span> {selectedReport.lat ?? "N/A"}, {selectedReport.lng ?? "N/A"}</p>
              <p><span className="font-semibold">Description:</span> {selectedReport.description || "No description provided."}</p>
              <p><span className="font-semibold">Created:</span> {formatDateTime(selectedReport.createdAt)}</p>
              <p><span className="font-semibold">Accepted:</span> {formatDateTime(selectedReport.acceptedAt)}</p>
              <p><span className="font-semibold">Resolved:</span> {formatDateTime(selectedReport.resolvedAt)}</p>
              <p><span className="font-semibold">Assigned Volunteer UID:</span> {selectedReport.assignedVolunteerUid || "N/A"}</p>
              <p><span className="font-semibold">Assigned Organization:</span> {selectedReport.assignedOrganization || "N/A"}</p>
            </div>

            {selectedReport.photoUrl ? (
              <img
                src={selectedReport.photoUrl}
                alt={`Report ${selectedReport.ticketId || selectedReport.id}`}
                className="mt-4 w-full rounded-xl object-cover ring-1 ring-black/10"
              />
            ) : (
              <p className="mt-4 text-sm text-neutral-600">No photo attached.</p>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFullReportOpen(false)}
                className="grad-btn-soft px-4 py-2 text-sm text-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
