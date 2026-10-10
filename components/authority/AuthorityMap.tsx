"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

export type MapProject = {
  id: number;
  title: string;
  street: string;
  status: string;
  budget: string | null;
  latitude: number;
  longitude: number;
};

// Same palette as the citizen map legend
const COLORS: Record<string, string> = {
  Planned: "#16a34a",
  "In Progress": "#f97316",
  Delayed: "#dc2626",
};

const CHENNAI: [number, number] = [13.0827, 80.2707];

function FitToProjects({ projects }: { projects: MapProject[] }) {
  const map = useMap();
  useEffect(() => {
    if (projects.length === 0) return;
    const bounds = projects.map((p) => [p.latitude, p.longitude] as [number, number]);
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [projects, map]);
  return null;
}

export default function AuthorityMap({ projects }: { projects: MapProject[] }) {
  return (
    <MapContainer
      center={CHENNAI}
      zoom={11}
      scrollWheelZoom
      className="h-[420px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToProjects projects={projects} />
      {projects.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude, p.longitude]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: COLORS[p.status] ?? "#6B7280",
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {p.street}
            <br />
            {p.status}
            {p.budget ? ` · ${p.budget}` : ""}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
