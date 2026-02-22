export const runtime = "nodejs";


import crypto from "crypto";
import { adminDb, adminFieldValue } from "@/lib/firebaseAdmin";
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

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Missing TURNSTILE_SECRET_KEY");

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip && ip !== "unknown") formData.append("remoteip", ip);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await resp.json();
  return data?.success === true;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      lat,
      lng,
      address = "",
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

    // 1) Verify captcha
    const captchaOk = await verifyTurnstile(captchaToken.toString().trim(), ip);
    if (!captchaOk) {
      return Response.json({ error: "Captcha verification failed." }, { status: 400 });
    }

    // 2) Rate limit IP
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

    // 3) Rate limit UID
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

    // 4) Create ticket (collision-safe)
    let ticketId = createTicketId();
    const reportRef = () => adminDb.collection("reports").doc(ticketId);

    // try create; if collision, try one more time
    try {
      await reportRef().create({
        ticketId,
        lat,
        lng,
        address: address ? address.toString().trim() : "",
        urgency: normalizeUrgency(urgency),
        description: description.toString().trim(),
        photoUrl: photoUrl ? photoUrl.toString().trim() : null,
        status: "PENDING",
        source: "resident",
        uid: uid || null,
        ipHash: crypto.createHash("sha256").update(ip).digest("hex"),
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      });
    } catch (e) {
      // collision -> regenerate once
      ticketId = createTicketId();
      await adminDb.collection("reports").doc(ticketId).create({
        ticketId,
        lat,
        lng,
        address: address ? address.toString().trim() : "",
        urgency: normalizeUrgency(urgency),
        description: description.toString().trim(),
        photoUrl: photoUrl ? photoUrl.toString().trim() : null,
        status: "PENDING",
        source: "resident",
        uid: uid || null,
        ipHash: crypto.createHash("sha256").update(ip).digest("hex"),
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      });
    }

    return Response.json({ ok: true, ticketId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error?.message || "Failed to submit report." },
      { status: 500 }
    );
  }
}
