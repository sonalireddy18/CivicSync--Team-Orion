"use client";

import "leaflet-defaulticon-compatibility";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

export type LatLng = { lat: number; lng: number };

// Chennai, matching the existing project data
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
      zoom={12}
      scrollWheelZoom
      className="h-72 w-full rounded-xl border border-slate-200"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onChange} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          draggable
          eventHandlers={{
            dragend(e) {
              const ll = e.target.getLatLng();
              onChange({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
