"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useMemo, useRef, useState } from "react";
import L from "leaflet";

// Fix marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Prefer a shorter address for UI + reports
function formatAddress(a) {
  if (!a) return "";
  const parts = [
    a.road || a.pedestrian || a.footway || a.cycleway || a.path,
    a.neighbourhood || a.suburb || a.village || a.town || a.city_district,
    a.city || a.town || a.municipality,
    a.state,
    a.postcode,
    a.country,
  ].filter(Boolean);

  // remove duplicates while keeping order
  const uniq = [];
  for (const p of parts) if (!uniq.includes(p)) uniq.push(p);

  return uniq.join(", ");
}

function LocationMarker({ position, setPosition, setLocation, reverseGeocode }) {
  const clickSeq = useRef(0);

  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      setPosition(e.latlng);

      // optimistic update immediately (no waiting)
      setLocation({
        lat,
        lng,
        address: "Resolving address…",
        fullAddress: "",
      });

      const seq = ++clickSeq.current;

      try {
        const data = await reverseGeocode(lat, lng);
        // ignore stale responses (if user clicked multiple times quickly)
        if (seq !== clickSeq.current) return;

        setLocation({
          lat,
          lng,
          address: data.address || "",
          fullAddress: data.fullAddress || "",
        });
      } catch {
        setLocation({
          lat,
          lng,
          address: "",
          fullAddress: "",
        });
      }
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function ReportMap({ setLocation }) {
  const defaultCenter = useMemo(() => [7.0731, 125.6128], []);
  const [map, setMap] = useState(null);

  const [position, setPosition] = useState(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Nominatim: include a UA so it’s less likely to reject requests
  const NOMINATIM_HEADERS = {
    "Accept-Language": "en",
    // Some environments ignore User-Agent in browsers, but harmless to include.
    "User-Agent": "PawsConnectDavao/1.0 (reporting map)",
  };

  async function reverseGeocode(lat, lng) {
    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        zoom: "18",
        addressdetails: "1",
      });

    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) throw new Error("Failed reverse geocode");

    const data = await res.json();
    const fullAddress = (data?.display_name || "").toString();
    const shortAddress = formatAddress(data?.address);

    return {
      address: shortAddress || fullAddress,
      fullAddress,
    };
  }

  async function searchAddress() {
    setErr("");
    setResults([]);

    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q,
          format: "jsonv2",
          addressdetails: "1",
          limit: "5",
          countrycodes: "ph",
        });

      const res = await fetch(url, { headers: NOMINATIM_HEADERS });
      if (!res.ok) throw new Error("Failed search");

      const data = await res.json();

      const mapped = (Array.isArray(data) ? data : []).map((d) => ({
        display_name: d.display_name,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
      }));

      setResults(mapped);
      if (mapped.length === 0) setErr("No results found.");
    } catch {
      setErr("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function chooseResult(r) {
    const lat = r.lat;
    const lng = r.lng;

    const latlng = { lat, lng };
    setPosition(latlng);

    if (map) map.setView([lat, lng], 16);

    // Use reverse geocode to store a consistent short address
    setLocation({ lat, lng, address: "Resolving address…", fullAddress: "" });

    try {
      const data = await reverseGeocode(lat, lng);
      setLocation({ lat, lng, address: data.address, fullAddress: data.fullAddress });
    } catch {
      // fallback to whatever nominatim returned in search
      setLocation({ lat, lng, address: r.display_name, fullAddress: r.display_name });
    }

    setResults([]);
  }

  return (
    <div className="relative z-0 overflow-hidden rounded-xl border">
      {/* Search UI */}
      <div className="border-b bg-white p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search address/landmark (e.g., SM Lanang Davao)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchAddress();
            }}
          />
          <button
            type="button"
            onClick={searchAddress}
            disabled={loading}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

        {results.length > 0 && (
          <div className="mt-2 max-h-44 overflow-auto rounded-lg border">
            {results.map((r, idx) => (
              <button
                key={`${r.lat}-${r.lng}-${idx}`}
                type="button"
                className="w-full border-b px-3 py-2 text-left hover:bg-gray-50 last:border-b-0"
                onClick={() => chooseResult(r)}
              >
                <p className="text-sm">{r.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "288px", width: "100%", position: "relative", zIndex: 0 }}
        className="relative z-0 overflow-hidden rounded-b-xl"
        whenCreated={setMap}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker
          position={position}
          setPosition={setPosition}
          setLocation={setLocation}
          reverseGeocode={reverseGeocode}
        />
      </MapContainer>
    </div>
  );
}