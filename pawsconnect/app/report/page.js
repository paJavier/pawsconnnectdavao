"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage, auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import TurnstileWidget from "@/components/TurnstileWidget";

const ReportMap = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="mt-4 flex h-72 items-center justify-center rounded-2xl bg-white/80 text-sm text-neutral-500 ring-1 ring-black/10">
      Loading map...
    </div>
  ),
});

export default function ReportPage() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState("");

  const [urgency, setUrgency] = useState("LOW");
  const [description, setDescription] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // OPTIONAL (recommended): silent anonymous auth (reporters still "don't log in")
  useEffect(() => {
    (async () => {
      try {
        if (!auth?.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) {
        // If anonymous auth fails, we still allow IP-only limiting on server.
        console.error("Anonymous auth failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or below.");
      return;
    }

    setError("");
    setPhotoFile(file);
  }

  async function handleSubmit() {
    setError("");

    if (!lat || !lng) return setError("Please select a location.");
    if (!description.trim()) return setError("Please add a description.");
    if (!captchaToken) return setError("Please complete the captcha.");

    try {
      setSubmitting(true);

      let photoUrl = null;

      // Upload photo to Firebase Storage (optional)
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const fileName = `report-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const storageRef = ref(storage, `reports/${fileName}`);
        await uploadBytes(storageRef, photoFile);
        photoUrl = await getDownloadURL(storageRef);
      }

      const uid = auth?.currentUser?.uid || null;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          address,
          urgency,
          description,
          captchaToken,
          photoUrl,
          uid, // for UID rate limiting (anonymous auth)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to submit report.");
        return;
      }

      setTicketId(data.ticketId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  

  // Submitted view
  if (ticketId) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="grad-card p-8 text-center">
          <span className="grad-pill">Submission Complete</span>
          <h1 className="mt-4 text-2xl font-extrabold text-primary">
            Report Successfully Submitted
          </h1>
          <p className="mt-3 text-neutral-700">
            Tracking ID:{" "}
            <span className="font-mono font-semibold text-neutral-900">{ticketId}</span>
          </p>

          {address ? (
            <p className="mt-2 text-sm text-neutral-700">
              Location: <span className="font-medium text-neutral-900">{address}</span>
            </p>
          ) : null}

          {photoFile ? (
            <p className="mt-2 text-sm text-neutral-700">Photo attached successfully.</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/status" className="grad-btn text-sm">
              Track Report
            </Link>
            <Link href="/" className="grad-btn-soft text-sm">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="grad-card p-8">
        <span className="grad-pill">Resident Reporting</span>
        <h1 className="mt-4 text-3xl font-extrabold text-primary md:text-4xl">
          Report a Stray Animal
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-700">
          Share the location and details of the stray so nearby volunteer groups can respond faster.
        </p>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {/* LOCATION */}
        <div className="grad-card p-6">
          <h2 className="text-lg font-extrabold text-primary">Select Location</h2>
          <p className="mt-1 text-sm text-neutral-700">
            Search an address/landmark or pin the exact location for faster verification.
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-black/10">
            <ReportMap
              setLocation={(loc) => {
                const nextLat = Number(loc?.lat);
                const nextLng = Number(loc?.lng);
                const nextAddr = String(loc?.address || "");

                if (!Number.isNaN(nextLat) && !Number.isNaN(nextLng)) {
                  setLat(Number(nextLat.toFixed(6)));
                  setLng(Number(nextLng.toFixed(6)));
                  setAddress(nextAddr);
                }
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <span className="text-sm text-neutral-700">
              {lat && lng ? `(${lat}, ${lng})` : "No location selected yet"}
            </span>
            {address ? <span className="text-xs text-neutral-600">{address}</span> : null}
          </div>
        </div>

        {/* FORM */}
        <div className="grad-card-ngo p-6">
          <h2 className="text-lg font-extrabold text-primary">Report Details</h2>
          <p className="mt-1 text-sm text-neutral-700">Describe what happened and set urgency.</p>

          <label className="mt-4 block text-sm font-semibold text-neutral-700">Urgency</label>
          <select
            className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 p-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <label className="mt-4 block text-sm font-semibold text-neutral-700">Description</label>
          <textarea
            className="mt-2 h-32 w-full rounded-xl border border-black/10 bg-white/90 p-3 text-sm outline-none ring-2 ring-transparent transition focus:ring-primary/30"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Animal report description"
          />

          <div className="mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
            <p className="text-sm font-semibold text-neutral-700">Photo (optional)</p>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 p-2 text-sm"
            />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected report"
                className="mt-3 h-36 w-full rounded-xl object-cover ring-1 ring-black/10"
              />
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl bg-white/70 p-4 ring-1 ring-black/10">
            <p className="text-sm font-semibold text-neutral-700">Captcha</p>

            {/* CAPTCHA */}
            <TurnstileWidget
              onToken={(token) => {
                setCaptchaToken(token);
                setError("");
              }}
              onExpire={() => setCaptchaToken("")}
              onError={() => setError("Captcha failed to load. Please refresh and try again.")}
            />
          </div>

          {error ? (
            <p className="mt-3 rounded-xl bg-red-100 p-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          ) : null}

          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="grad-btn mt-5 w-full text-center disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </section>
    </div>
  );
}