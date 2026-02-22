"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useMemo, useState } from "react";
import L from "leaflet";

// Fix marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition, setLocation, reverseGeocode }) {
  useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      const baseLoc = { lat: e.latlng.lat, lng: e.latlng.lng, address: "" };
      setLocation(baseLoc);

      try {
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        if (address) {
          setLocation({ ...baseLoc, address });
        }
      } catch {
        // Keep lat/lng even if reverse geocoding fails.
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

  async function reverseGeocode(lat, lng) {
    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        zoom: "18",
      });

    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });

    if (!res.ok) throw new Error("Failed reverse geocode");
    const data = await res.json();
    return (data?.display_name || "").toString();
  }

  async function searchAddress() {
    setErr("");
    setResults([]);

    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      // PH-only results; remove countrycodes if you want worldwide
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q,
          format: "json",
          addressdetails: "1",
          limit: "5",
          countrycodes: "ph",
        });

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!res.ok) throw new Error("Failed search");

      const data = await res.json();

      const mapped = data.map((d) => ({
        display_name: d.display_name,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lon),
      }));

      setResults(mapped);
      if (mapped.length === 0) setErr("No results found.");
    } catch (e) {
      setErr("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function chooseResult(r) {
    const latlng = { lat: r.lat, lng: r.lng };
    setPosition(latlng);

    // Pan + zoom the map to searched location
    if (map) {
      map.setView([r.lat, r.lng], 16);
    }

    // Include address in the report
    setLocation({
      lat: r.lat,
      lng: r.lng,
      address: r.display_name,
    });

    // clear dropdown (optional)
    setResults([]);
  }

  return (
    <div className="relative z-0 overflow-hidden rounded-xl border">
      {/* Search UI */}
      <div className="p-3 bg-white border-b">
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

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="mt-2 max-h-44 overflow-auto rounded-lg border">
            {results.map((r, idx) => (
              <button
                key={`${r.lat}-${r.lng}-${idx}`}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                onClick={() => chooseResult(r)}
              >
                <p className="text-sm">{r.display_name}</p>
                <p className="text-xs text-gray-600">
                  {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                </p>
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
