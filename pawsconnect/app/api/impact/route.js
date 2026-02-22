export const runtime = "nodejs";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") {
    return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
  }
  return null;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "--";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function avg(values) {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function countVerifiedActiveVolunteers() {
  const appsSnap = await adminDb.collection("partnerApplications").get();
  const candidates = appsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter(
      (a) =>
        (a.status || "").toString().trim().toLowerCase() === "approved" &&
        Boolean(a.isActiveResponder)
    );

  if (!candidates.length) return 0;

  const checks = await Promise.allSettled(
    candidates.map((a) => adminAuth.getUser(a.id))
  );

  return checks.filter(
    (r) => r.status === "fulfilled" && r.value?.emailVerified
  ).length;
}

export async function GET() {
  try {
    const reportsSnap = await adminDb.collection("reports").get();
    const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const totalReports = reports.length;
    const resolvedReports = reports.filter(
      (r) => (r.status || "").toString().trim().toUpperCase() === "RESOLVED"
    );

    const responseDurations = reports
      .map((r) => {
        const created = toMillis(r.createdAt);
        const accepted = toMillis(r.acceptedAt);
        return created && accepted && accepted >= created ? accepted - created : null;
      })
      .filter((v) => Number.isFinite(v));

    const resolutionDurations = resolvedReports
      .map((r) => {
        const created = toMillis(r.createdAt);
        const resolved = toMillis(r.resolvedAt);
        return created && resolved && resolved >= created ? resolved - created : null;
      })
      .filter((v) => Number.isFinite(v));

    const activeVolunteerAccounts = await countVerifiedActiveVolunteers();

    const averageResponseMs = avg(responseDurations);
    const averageResolutionMs = avg(resolutionDurations);

    const body = {
      totalReports,
      resolvedReports: resolvedReports.length,
      activeVolunteerAccounts,
      averageResponseMs,
      averageResponseLabel: formatDuration(averageResponseMs),
      averageResolutionMs,
      averageResolutionLabel: formatDuration(averageResolutionMs),
      updatedAt: Date.now(),
    };

    return Response.json(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Impact metrics error:", error);
    return Response.json(
      {
        error: "Failed to load impact metrics.",
        totalReports: 0,
        resolvedReports: 0,
        activeVolunteerAccounts: 0,
        averageResponseMs: null,
        averageResponseLabel: "--",
        averageResolutionMs: null,
        averageResolutionLabel: "--",
      },
      { status: 500 }
    );
  }
}

