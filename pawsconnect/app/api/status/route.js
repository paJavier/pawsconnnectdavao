export const runtime = "nodejs";

import { adminDb } from "@/lib/firebaseAdmin";

function normalizeTicketId(value) {
  return (value || "").toString().trim().toUpperCase();
}

function serializeTimestamp(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();
  if (typeof ts.seconds === "number") {
    return new Date(ts.seconds * 1000).toISOString();
  }
  return null;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = normalizeTicketId(searchParams.get("ticketId"));

    if (!ticketId) {
      return Response.json({ error: "Ticket ID is required." }, { status: 400 });
    }

    const snap = await adminDb
      .collection("reports")
      .where("ticketId", "==", ticketId)
      .limit(1)
      .get();

    if (snap.empty) {
      return Response.json({ error: "Ticket not found." }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    return Response.json(
      {
        id: doc.id,
        ticketId: data.ticketId || ticketId,
        status: (data.status || "PENDING").toString().toUpperCase(),
        urgency: (data.urgency || "LOW").toString().toUpperCase(),
        address: data.address || "",
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        description: data.description || "",
        photoUrl: data.photoUrl || null,
        assignedOrganization: data.assignedOrganization || null,
        createdAt: serializeTimestamp(data.createdAt),
        acceptedAt: serializeTimestamp(data.acceptedAt),
        resolvedAt: serializeTimestamp(data.resolvedAt),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Status lookup error:", error);
    return Response.json(
      { error: error?.message || "Failed to fetch ticket status." },
      { status: 500 }
    );
  }
}

