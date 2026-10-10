"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import type {
  CitizenReport,
  ComplaintRecord,
  Department,
  Project,
  ReportPrefill,
} from "@/types";
import {
  asCategory,
  categoryForDepartment,
  countdownLabel,
  distanceKm,
  reportsByProject,
} from "@/lib/projectUtils";
import { useNow } from "@/lib/useNow";

export interface LatLng {
  lat: number;
  lng: number;
}

export const STATUS_DOT: Record<string, string> = {
  Planned: "#16a34a", // green
  "In Progress": "#f97316", // orange
  Delayed: "#dc2626", // red
};
const COMPLAINT_DOT = "#7c3aed"; // purple
const USER_DOT = "#2563eb"; // blue

const DEFAULT_CENTER: LatLngTuple = [13.0827, 80.2707]; // Chennai
/** How close a project must be (km) to offer "Verification" from a complaint dot. */
const NEARBY_PROJECT_KM = 0.5;

export default function PublicWorksMap({
  projects,
  complaints,
  reports,
  departments,
  userLocation,
  focus,
  onFileReport,
  onVerify,
  onEmptyPlaceChosen,
}: {
  projects: Project[];
  complaints: ComplaintRecord[];
  reports: CitizenReport[];
  departments: Department[];
  userLocation: LatLng | null;
  /** Change `key` to make the map fly to a spot (e.g. a complaint picked from the log). */
  focus?: (LatLng & { key: number }) | null;
  onFileReport: (prefill: ReportPrefill) => void;
  onVerify: (prefill: ReportPrefill) => void;
  /** The user clicked empty ground and said "Yes, report here". */
  onEmptyPlaceChosen: (at: LatLng) => void;
}) {
  const now = useNow();
  const byProject = useMemo(() => reportsByProject(reports), [reports]);

  const mappedComplaints = complaints.filter(
    (c) => c.latitude != null && c.longitude != null
  );

  const allPoints: LatLngTuple[] = useMemo(
    () => [
      ...projects.map((p) => [p.latitude, p.longitude] as LatLngTuple),
      ...mappedComplaints.map((c) => [c.latitude!, c.longitude!] as LatLngTuple),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, complaints]
  );

  function projectPrefill(p: Project): ReportPrefill {
    return {
      category: categoryForDepartment(departments, p.department_id),
      departmentId: p.department_id,
      department: p.department,
      street: p.street,
      latitude: p.latitude,
      longitude: p.longitude,
      projectId: p.id,
    };
  }

  function complaintPrefill(c: ComplaintRecord): ReportPrefill {
    return {
      category: asCategory(c.complaint_type),
      departmentId: c.department_id,
      department: c.department,
      street: c.street,
      latitude: c.latitude,
      longitude: c.longitude,
    };
  }

  function nearestProject(c: ComplaintRecord): Project | null {
    let best: Project | null = null;
    let bestD = NEARBY_PROJECT_KM;
    for (const p of projects) {
      const d = distanceKm(c.latitude!, c.longitude!, p.latitude, p.longitude);
      if (d <= bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  return (
    // `isolate` keeps Leaflet's internal z-indexes below the app's popups and drawer
    <div className="relative isolate h-full w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        minZoom={2}
        worldCopyJump
        doubleClickZoom={false}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToDots points={allPoints} />
        <FlyToFocus focus={focus ?? null} />
        <LocateListener userLocation={userLocation} />
        <MapGestures
          userLocation={userLocation}
          onEmptyPlaceChosen={onEmptyPlaceChosen}
        />

        {/* You are here */}
        {userLocation && (
          <>
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={18}
              interactive={false}
              pathOptions={{ color: USER_DOT, weight: 0, fillColor: USER_DOT, fillOpacity: 0.15 }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={7}
              interactive={false}
              pathOptions={{ color: "#fff", weight: 2, fillColor: USER_DOT, fillOpacity: 1 }}
            />
          </>
        )}

        {/* Projects: green planned, orange in progress, red delayed */}
        {projects.map((p) => {
          const list = byProject.get(p.id) ?? [];
          return (
            <CircleMarker
              key={`p-${p.id}`}
              center={[p.latitude, p.longitude]}
              radius={10}
              bubblingMouseEvents={false}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: STATUS_DOT[p.status] ?? "#64748b",
                fillOpacity: 1,
              }}
            >
              <Tooltip sticky direction="top" offset={[0, -8]} opacity={1}>
                <div style={{ whiteSpace: "normal", width: 240 }} className="text-xs leading-5">
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="font-semibold" style={{ color: STATUS_DOT[p.status] }}>
                    {p.status}
                  </p>
                  <p>Department: {p.department}</p>
                  <p>Contractor: {p.contractor ?? "Not assigned"}</p>
                  <p>Budget: {p.budget ?? "Not disclosed"}</p>
                  <p>
                    Timeline: {p.start_date ?? "—"} → {p.end_date ?? "—"}
                  </p>
                  <p>{countdownLabel(p.end_date, now)}</p>
                  {p.delay_reason && <p>Delay: {p.delay_reason}</p>}
                  <p>Citizen reports: {list.length}</p>
                  <p className="mt-1 text-slate-500">Click to file a report or verify</p>
                </div>
              </Tooltip>
              <ChoicePopup
                title={p.title}
                subtitle={`${p.street} · ${p.department}`}
                onFileReport={() => onFileReport(projectPrefill(p))}
                onVerify={() => onVerify(projectPrefill(p))}
              />
            </CircleMarker>
          );
        })}

        {/* Citizen complaints */}
        {mappedComplaints.map((c) => {
          const near = nearestProject(c);
          return (
            <CircleMarker
              key={`c-${c.id}`}
              center={[c.latitude!, c.longitude!]}
              radius={8}
              bubblingMouseEvents={false}
              pathOptions={{
                color: "#fff",
                weight: 2,
                fillColor: COMPLAINT_DOT,
                fillOpacity: 1,
              }}
            >
              <Tooltip sticky direction="top" offset={[0, -8]} opacity={1}>
                <div style={{ whiteSpace: "normal", width: 240 }} className="text-xs leading-5">
                  <p className="text-sm font-bold">Citizen complaint</p>
                  <p className="font-semibold" style={{ color: COMPLAINT_DOT }}>
                    {c.complaint_status}
                  </p>
                  <p>Category: {c.complaint_type}</p>
                  <p>Department: {c.department}</p>
                  <p>Area: {c.street}</p>
                  <p className="mt-1">{c.description}</p>
                  <p className="mt-1 text-slate-500">Click to file a report or verify</p>
                </div>
              </Tooltip>
              <ChoicePopup
                title={`${c.complaint_type} complaint`}
                subtitle={`${c.street} · ${c.department}`}
                onFileReport={() => onFileReport(complaintPrefill(c))}
                onVerify={
                  near
                    ? () =>
                        onVerify({
                          ...projectPrefill(near),
                          street: c.street,
                        })
                    : undefined
                }
                verifyNote={
                  near
                    ? `Verifies: ${near.title}`
                    : "Verification needs a project nearby."
                }
              />
            </CircleMarker>
          );
        })}
      </MapContainer>

      <Legend />
      <LocateButton userLocation={userLocation} />
    </div>
  );
}

/** Popup shown when a dot is clicked: choose File Report or Verification. */
function ChoicePopup({
  title,
  subtitle,
  onFileReport,
  onVerify,
  verifyNote,
}: {
  title: string;
  subtitle: string;
  onFileReport: () => void;
  onVerify?: () => void;
  verifyNote?: string;
}) {
  const map = useMap();
  const btn =
    "w-full rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <Popup minWidth={230} closeButton>
      <div className="space-y-2">
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <button
          className={`${btn} bg-emerald-700 text-white hover:bg-emerald-800`}
          onClick={() => {
            map.closePopup();
            onFileReport();
          }}
        >
          File Report
        </button>
        <button
          className={`${btn} border border-slate-300 bg-white text-slate-800 hover:bg-slate-100`}
          disabled={!onVerify}
          onClick={() => {
            map.closePopup();
            onVerify?.();
          }}
        >
          Verification
        </button>
        {verifyNote && <p className="text-xs text-slate-500">{verifyNote}</p>}
      </div>
    </Popup>
  );
}

/**
 * Click empty ground -> "Report an issue here?"
 * Double-click -> jump to the user's location when it is off-screen,
 * otherwise zoom in as usual (normal double-click zoom is switched off
 * so the two gestures don't fight).
 */
function MapGestures({
  userLocation,
  onEmptyPlaceChosen,
}: {
  userLocation: LatLng | null;
  onEmptyPlaceChosen: (at: LatLng) => void;
}) {
  const [pending, setPending] = useState<LatLng | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPopupClose = useRef(0);

  const map = useMapEvents({
    popupclose: () => {
      lastPopupClose.current = Date.now();
    },
    click: (e) => {
      // A click that only dismissed a popup should not start a new prompt
      if (Date.now() - lastPopupClose.current < 150) return;
      if (timer.current) clearTimeout(timer.current);
      // Wait briefly: if a second click follows, it is a double-click instead
      timer.current = setTimeout(() => {
        setPending({ lat: e.latlng.lat, lng: e.latlng.lng });
      }, 280);
    },
    dblclick: (e) => {
      if (timer.current) clearTimeout(timer.current);
      setPending(null);
      if (userLocation) {
        const here: LatLngTuple = [userLocation.lat, userLocation.lng];
        if (!map.getBounds().contains(here)) {
          map.flyTo(here, Math.max(map.getZoom(), 14));
          return;
        }
      }
      map.setZoomAround(e.latlng, map.getZoom() + 1);
    },
  });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  if (!pending) return null;
  return (
    <Popup
      position={[pending.lat, pending.lng]}
      eventHandlers={{ remove: () => setPending(null) }}
      minWidth={220}
    >
      <div className="space-y-2">
        <p className="text-sm font-bold">Report an issue here?</p>
        <p className="text-xs text-slate-500">
          {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
        </p>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            onClick={() => {
              const at = pending;
              map.closePopup();
              setPending(null);
              onEmptyPlaceChosen(at);
            }}
          >
            Yes
          </button>
          <button
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            onClick={() => {
              map.closePopup();
              setPending(null);
            }}
          >
            No
          </button>
        </div>
      </div>
    </Popup>
  );
}

/** Zooms to show every dot the first time data arrives. */
function FitToDots({ points }: { points: LatLngTuple[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    const bounds: LatLngBoundsExpression = points;
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function FlyToFocus({ focus }: { focus: (LatLng & { key: number }) | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key]);
  return null;
}

/** Listens for the "My location" button and moves the map there. */
function LocateListener({ userLocation }: { userLocation: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (!userLocation) return;
    const go = () =>
      map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 14));
    window.addEventListener("civic:locate", go);
    return () => window.removeEventListener("civic:locate", go);
  }, [map, userLocation]);
  return null;
}

function Legend() {
  const item = (color: string, label: string) => (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow">
      {item(STATUS_DOT.Planned, "Planned")}
      {item(STATUS_DOT["In Progress"], "In Progress")}
      {item(STATUS_DOT.Delayed, "Stalled / Delay")}
      {item(COMPLAINT_DOT, "Complaint")}
      {item(USER_DOT, "You")}
    </div>
  );
}

/** Small button that is rendered inside the map's wrapper, above the tiles. */
function LocateButton({ userLocation }: { userLocation: LatLng | null }) {
  // Needs the map instance, which only children of <MapContainer> can reach.
  // So this button talks to the map through a custom DOM event instead.
  return (
    <button
      type="button"
      disabled={!userLocation}
      title={userLocation ? "Centre on my location" : "Location is off or not available"}
      onClick={() => window.dispatchEvent(new CustomEvent("civic:locate"))}
      className="absolute right-3 top-3 z-[500] rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      ◎ My location
    </button>
  );
}
