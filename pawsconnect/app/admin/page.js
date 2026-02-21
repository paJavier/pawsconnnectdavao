"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getDocsFromServer, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [apps, setApps] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadApps = async (activeFilter = filter) => {
    setLoadingApps(true);
    try {
      let snap;
      try {
        snap = await getDocsFromServer(collection(db, "partnerApplications"));
      } catch {
        snap = await getDocs(collection(db, "partnerApplications"));
      }
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const normalized = data.map((a) => ({
        ...a,
        status: (a.status || "pending").toString().trim().toLowerCase(),
      }));
      const filtered =
        activeFilter === "all" ? normalized : normalized.filter((a) => a.status === activeFilter);

      filtered.sort((a, b) => {
        const at = a.createdAt?.seconds || 0;
        const bt = b.createdAt?.seconds || 0;
        return bt - at;
      });

      setApps(filtered);
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to load applications." });
      setApps([]);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoginLoading(false);
      if (!user) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const role = userSnap.exists()
        ? (userSnap.data()?.role || "").toString().trim().toLowerCase()
        : null;

      if (role !== "admin") {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      setIsAdmin(true);
      setCheckingAuth(false);
      await loadApps(filter);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (isAdmin) loadApps(filter);
  }, [filter, isAdmin]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setMessage({ type: "", text: "" });
      setLoginLoading(true);
      await signInWithEmailAndPassword(auth, loginForm.email.trim(), loginForm.password);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Admin login failed." });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSetStatus = async (id, nextStatus) => {
    try {
      setSavingId(id);
      await updateDoc(doc(db, "partnerApplications", id), {
        status: nextStatus,
        approvedAt: nextStatus === "approved" ? serverTimestamp() : null,
        approvedBy: nextStatus === "approved" ? auth.currentUser?.uid || null : null,
        updatedAt: serverTimestamp(),
      });
      setMessage({ type: "success", text: `Application updated to ${nextStatus}.` });
      await loadApps(filter);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to update status." });
    } finally {
      setSavingId("");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  if (checkingAuth) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grad-card-ngo p-8">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grad-card-ngo p-8">
          <h1 className="text-2xl font-extrabold text-primary">Admin Login</h1>
          <p className="mt-2 text-sm text-neutral-700">
            Sign in with an admin account (`users/{`uid`}.role = "admin"`).
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

          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            <input
              type="email"
              name="email"
              value={loginForm.email}
              onChange={handleLoginChange}
              required
              placeholder="Admin email"
              className="w-full rounded-xl border px-4 py-3"
            />
            <input
              type="password"
              name="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              required
              placeholder="Password"
              className="w-full rounded-xl border px-4 py-3"
            />
            <button
              type="submit"
              disabled={loginLoading}
              className="grad-btn w-full py-3 text-sm disabled:opacity-60"
            >
              {loginLoading ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {message.text ? (
        <div
          className={`mb-4 rounded-xl p-3 text-sm ${
            message.type === "error"
              ? "bg-red-100 text-red-700 ring-1 ring-red-200"
              : "bg-green-100 text-green-700 ring-1 ring-green-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary">Admin Approval Panel</h1>
          <p className="mt-1 text-neutral-700">Approve or reject volunteer organization applications.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-neutral-800">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/90 px-3 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={() => loadApps(filter)}
            className="grad-btn-soft px-4 py-2 text-sm text-secondary"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="grad-btn-soft px-4 py-2 text-sm text-neutral-800"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {loadingApps ? (
          <div className="grad-card-ngo p-8 text-neutral-700">
            Loading applications...
          </div>
        ) : null}

        {!loadingApps &&
          apps.map((a) => (
            <div key={a.id} className="grad-card-ngo p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-extrabold text-primary">{a.organization || "-"}</p>
                  <p className="text-sm text-neutral-700">Contact: {a.fullName || "-"}</p>
                  <p className="text-sm text-neutral-700">Email: {a.email || "-"}</p>
                  <p className="text-sm text-neutral-700">Phone: {a.phone || "-"}</p>
                  <p className="mt-2 text-sm">
                    Status:{" "}
                    <span className="grad-pill">
                      {a.status}
                    </span>
                  </p>
                  {a.permitLink || a.permitUrl ? (
                    <p className="mt-2 text-sm">
                      Proof:{" "}
                      <a
                        className="font-semibold text-secondary underline"
                        href={a.permitLink || a.permitUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open file
                      </a>
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
                  {a.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleSetStatus(a.id, "approved")}
                        disabled={savingId === a.id}
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleSetStatus(a.id, "rejected")}
                        disabled={savingId === a.id}
                        className="rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSetStatus(a.id, "pending")}
                      disabled={savingId === a.id}
                      className="grad-btn-soft px-4 py-2 text-sm text-neutral-800 disabled:opacity-60"
                    >
                      Set Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

        {!loadingApps && apps.length === 0 ? (
          <div className="grad-card-ngo p-8 text-neutral-700">
            No applications found for this filter.
          </div>
        ) : null}
      </div>
    </div>
  );
}
