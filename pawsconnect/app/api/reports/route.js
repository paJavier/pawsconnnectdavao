import crypto from "crypto";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reportLimiter10m, reportLimiterDay } from "@/lib/ratelimit";

function getClientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function createTicketId() {
  const suffix = crypto.randomInt(10000, 99999);
  return `PC-${suffix}`;
}

function normalizeUrgency(value) {
  const valid = new Set(["LOW", "MEDIUM", "HIGH"]);
  const urgency = (value || "").toString().trim().toUpperCase();
  return valid.has(urgency) ? urgency : "LOW";
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      lat,
      lng,
      urgency,
      description,
      captchaToken,
      uid = null,
      photoUrl = null,
    } = body || {};

    if (typeof lat !== "number" || typeof lng !== "number") {
      return Response.json({ error: "Invalid location." }, { status: 400 });
    }

    if (!description || !description.toString().trim()) {
      return Response.json({ error: "Description is required." }, { status: 400 });
    }

    if (!captchaToken || !captchaToken.toString().trim()) {
      return Response.json({ error: "Captcha is required." }, { status: 400 });
    }

    if (photoUrl && typeof photoUrl !== "string") {
      return Response.json({ error: "Invalid image URL." }, { status: 400 });
    }

    const ip = getClientIp(req);
    const ipKey = `ip:${crypto.createHash("sha256").update(ip).digest("hex")}`;

    const [ip10m, ipDay] = await Promise.all([
      reportLimiter10m.limit(ipKey),
      reportLimiterDay.limit(ipKey),
    ]);

    if (!ip10m.success || !ipDay.success) {
      return Response.json(
        { error: "Too many reports. Please wait and try again." },
        { status: 429 }
      );
    }

    if (uid) {
      const uidKey = `uid:${uid}`;
      const [uid10m, uidDay] = await Promise.all([
        reportLimiter10m.limit(uidKey),
        reportLimiterDay.limit(uidKey),
      ]);

      if (!uid10m.success || !uidDay.success) {
        return Response.json(
          { error: "Too many reports on this device. Please wait and try again." },
          { status: 429 }
        );
      }
    }

    const ticketId = createTicketId();

    await addDoc(collection(db, "reports"), {
      ticketId,
      lat,
      lng,
      urgency: normalizeUrgency(urgency),
      description: description.toString().trim(),
      photoUrl: photoUrl ? photoUrl.toString().trim() : null,
      status: "PENDING",
      source: "resident",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return Response.json({ ok: true, ticketId }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to submit report." },
      { status: 500 }
    );
  }
}
