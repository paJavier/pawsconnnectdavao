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

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

async function uploadReportPhoto(file) {
  if (!file) return null;
  if (typeof file.arrayBuffer !== "function") {
    throw new Error("Invalid image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or below.");
  }

  const contentType = file.type || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary env vars.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "pawsconnect/reports";
  const publicId = `report-${Date.now()}-${crypto.randomUUID()}`;
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", apiKey);
  uploadForm.append("timestamp", String(timestamp));
  uploadForm.append("folder", folder);
  uploadForm.append("public_id", publicId);
  uploadForm.append("signature", signature);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let resp;
  try {
    resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Image upload timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || "Image upload failed.");
  }

  return data?.secure_url || null;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) throw new Error("Missing TURNSTILE_SECRET_KEY");

  async function verifyAttempt(includeRemoteIp) {
    const formData = new FormData();
    formData.append("secret", secret);
    formData.append("response", token);
    if (includeRemoteIp && ip && ip !== "unknown") formData.append("remoteip", ip);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      return await resp.json();
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Captcha verification timed out. Please try again.");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  let data = await verifyAttempt(true);

  if (
    data?.success !== true &&
    Array.isArray(data?.["error-codes"]) &&
    data["error-codes"].includes("invalid-remoteip")
  ) {
    data = await verifyAttempt(false);
  }

  if (data?.success !== true) {
    console.error("Turnstile verification failed", {
      errorCodes: data?.["error-codes"] || [],
      hostname: data?.hostname || null,
      action: data?.action || null,
      cdata: data?.cdata || null,
    });
  }

  return data?.success === true;
}

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let lat;
    let lng;
    let address = "";
    let urgency;
    let description;
    let captchaToken;
    let uid = null;
    let photoUrl = null;
    let photoFile = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      lat = parseNumber(form.get("lat"));
      lng = parseNumber(form.get("lng"));
      address = (form.get("address") || "").toString();
      urgency = (form.get("urgency") || "").toString();
      description = (form.get("description") || "").toString();
      captchaToken = (form.get("captchaToken") || "").toString();
      uid = (form.get("uid") || "").toString() || null;
      const maybeFile = form.get("photo");
      if (maybeFile && typeof maybeFile === "object" && typeof maybeFile.arrayBuffer === "function") {
        photoFile = maybeFile;
      }
    } else {
      const body = await req.json();
      lat = body?.lat;
      lng = body?.lng;
      address = body?.address || "";
      urgency = body?.urgency;
      description = body?.description;
      captchaToken = body?.captchaToken;
      uid = body?.uid || null;
      photoUrl = body?.photoUrl || null;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
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

    if (photoFile) {
      photoUrl = await uploadReportPhoto(photoFile);
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
