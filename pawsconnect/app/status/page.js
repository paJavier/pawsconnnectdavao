"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

function statusBadgeClass(status) {
  switch ((status || "").toUpperCase()) {
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "ACCEPTED":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    default:
      return "bg-blue-100 text-blue-800 ring-blue-200";
  }
}

export default function StatusPage() {
  const [ticketInput, setTicketInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const timeline = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Report submitted", time: result.createdAt, done: Boolean(result.createdAt) },
      { label: "Accepted by volunteer", time: result.acceptedAt, done: Boolean(result.acceptedAt) },
      { label: "Resolved", time: result.resolvedAt, done: Boolean(result.resolvedAt) },
    ];
  }, [result]);

  async function handleTrack(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    const ticketId = ticketInput.trim().toUpperCase();
    if (!ticketId) {
      setError("Please enter your ticket ID.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/status?ticketId=${encodeURIComponent(ticketId)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Unable to find that ticket.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <section className="grad-card p-8">
        <span className="grad-pill">Resident Tracking</span>
        <h1 className="mt-4 text-3xl font-extrabold text-primary md:text-4xl">Track Your Report</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Enter the tracking ID you received after submitting a report (example: <span className="font-mono">PC-12345</span>).
        </p>

        <form onSubmit={handleTrack} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            placeholder="Enter ticket ID (e.g., PC-12345)"
            className="w-full rounded-xl border border-black/10 bg-white/95 px-4 py-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="grad-btn text-center disabled:opacity-60"
          >
            {loading ? "Checking..." : "Track Ticket"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-xl bg-red-100 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
        ) : null}

        <div className="mt-5 text-sm text-neutral-700">
          <Link href="/report" className="font-semibold text-secondary underline">
            Need to submit a new report?
          </Link>
        </div>
      </section>

      {result ? (
        <section className="mt-8 grad-card-ngo p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-primary">Ticket {result.ticketId}</h2>
              <p className="mt-1 text-sm text-neutral-700">
                {result.address || (result.lat != null && result.lng != null ? `${result.lat}, ${result.lng}` : "Location unavailable")}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusBadgeClass(result.status)}`}>
              {result.status}
            </span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-black/5">
              <h3 className="text-sm font-bold text-neutral-900">Report Details</h3>
              <p className="mt-3 text-sm text-neutral-700">
                <span className="font-semibold text-neutral-900">Urgency:</span> {result.urgency || "LOW"}
              </p>
              <p className="mt-2 text-sm text-neutral-700">
                <span className="font-semibold text-neutral-900">Description:</span> {result.description || "No description provided."}
              </p>
              {result.assignedOrganization ? (
                <p className="mt-2 text-sm text-neutral-700">
                  <span className="font-semibold text-neutral-900">Assigned to:</span> {result.assignedOrganization}
                </p>
              ) : null}

              {result.photoUrl ? (
                <img
                  src={result.photoUrl}
                  alt="Reported animal"
                  className="mt-4 h-48 w-full rounded-xl object-cover ring-1 ring-black/10"
                />
              ) : (
                <p className="mt-4 text-xs text-neutral-600">No photo attached.</p>
              )}
            </div>

            <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-black/5">
              <h3 className="text-sm font-bold text-neutral-900">Progress Timeline</h3>
              <div className="mt-4 space-y-4">
                {timeline.map((step, idx) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-0.5 h-3 w-3 rounded-full ${
                          step.done ? "bg-emerald-500" : "bg-neutral-300"
                        }`}
                      />
                      {idx < timeline.length - 1 ? (
                        <span className="mt-1 h-10 w-px bg-neutral-200" />
                      ) : null}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold text-neutral-900">{step.label}</p>
                      <p className="text-xs text-neutral-600">
                        {step.done ? formatDate(step.time) : "Waiting"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

