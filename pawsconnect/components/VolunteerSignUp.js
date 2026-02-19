"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase"; // adjust path if needed
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function VolunteerSignUp({ isOpen, onClose }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    email: "",
    phone: "",
    password: "",
  });

  const [permitFile, setPermitFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPermitFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!permitFile) {
      alert("Please upload a permit or proof document.");
      return;
    }

    try {
      setLoading(true);

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      //  Upload permit to Storage
      const storageRef = ref(
        storage,
        `partner-permits/${user.uid}-${permitFile.name}`
      );

      await uploadBytes(storageRef, permitFile);
      const permitUrl = await getDownloadURL(storageRef);

      // Save application to Firestore
      await setDoc(doc(db, "partnerApplications", user.uid), {
        fullName: form.fullName,
        organization: form.organization,
        email: form.email,
        phone: form.phone,
        permitUrl,
        status: "pending",
        uid: user.uid,
        createdAt: serverTimestamp(),
      });

        setSuccessMessage("Application submitted! Redirecting to dashboard…");
        setTimeout(() => {
        onClose();
        router.push("/volunteer-orgs/dashboard");
        }, 1200);


        onClose();
        router.push("/volunteer-orgs/dashboard");

    } catch (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10">

        <button
          onClick={onClose}
          className="absolute right-4 top-3 text-2xl text-neutral-500 hover:text-neutral-700"
        >
          ×
        </button>

        <h3 className="text-2xl font-extrabold text-primary">
          Become a Verified Partner
        </h3>

        {successMessage ? (
          <div className="mt-5 rounded-xl bg-green-100 p-4 text-green-800">
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">

            <input
              type="text"
              name="fullName"
              required
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="text"
              name="organization"
              required
              placeholder="Organization Name"
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="email"
              name="email"
              required
              placeholder="Email"
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="tel"
              name="phone"
              required
              placeholder="Phone"
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <input
              type="password"
              name="password"
              required
              placeholder="Password"
              onChange={handleChange}
              className="w-full rounded-xl border px-4 py-3"
            />

            <div>
              <label className="text-sm font-semibold">
                Upload Permit / Proof Document
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mt-2 w-full"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-white shadow-md hover:shadow-lg"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
