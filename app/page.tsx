"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useView } from "@/components/layout/ViewProvider";
import ProjectDrawer, { statusBadge } from "@/components/map/ProjectDrawer";
import ComplaintModal from "@/components/citizen/ComplaintModal";
import ComplaintLog from "@/components/citizen/ComplaintLog";
import PhotoUploadModal, {
  VerificationLog,
  VerificationPopup,
} from "@/components/citizen/PhotoUploadModal";
import {
  fetchComplaints,
  fetchDepartments,
  fetchProjects,
  fetchReports,
  type Source,
} from "@/lib/data";
import {
  countdownLabel,
  distanceKm,
  projectsWithNotices,
  reportsByProject,
  reportTone,
  stalledReportsLast7Days,
  type ReportTone,
} from "@/lib/projectUtils";
import { useNow } from "@/lib/useNow";
import type {
  CitizenReport,
  ComplaintRecord,
  Department,
  Project,
  ProjectStatus,
  ReportPrefill,
} from "@/types";

// Leaflet needs the browser, so the map is loaded on the client only.
const PublicWorksMap = dynamic(() => import("@/components/map/PublicWorksMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
      Loading map...
    </div>
  ),
});

type StatusFilter = "All" | ProjectStatus;
type SortKey = "nearest" | "reports_desc" | "reports_asc" | "deadline" | "title";

const sortLabels: Record<SortKey, string> = {
  nearest: "Sort: Nearest first",
  reports_desc: "Sort: Most citizen reports",
  reports_asc: "Sort: Fewest citizen reports",
  deadline: "Sort: Deadline (soonest)",
  title: "Sort: Title (A–Z)",
};

type GeoState = "asking" | "granted" | "denied" | "unavailable";

/** Turns map coordinates into a short street/area name. Falls back to the coordinates. */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `Near ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(t);
    if (!res.ok) return fallback;
    const j = (await res.json()) as { address?: Record<string, string> };
    const a = j.address ?? {};
    const parts = [
      a.road ?? a.pedestrian ?? a.footway,
      a.neighbourhood ?? a.suburb ?? a.quarter,
      a.city ?? a.town ?? a.village ?? a.county,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : fallback;
  } catch {
    return fallback;
  }
}

export default function ProjectsPage() {
  const { view } = useView();
  const now = useNow();

  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Source>("mock");
  const [loadErrors, setLoadErrors] = useState<string[]>([]);

  const [geo, setGeo] = useState<GeoState>("asking");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All departments");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [sort, setSort] = useState<SortKey>("nearest");
  const [listOpen, setListOpen] = useState(true);
  const [noticesOpen, setNoticesOpen] = useState(false);

  const [selected, setSelected] = useState<Project | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [complaintCtx, setComplaintCtx] = useState<{ key: number; prefill?: ReportPrefill } | null>(null);
  const [verifyCtx, setVerifyCtx] = useState<{ key: number; prefill?: ReportPrefill } | null>(null);

  // Load everything once
  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, r, d, c] = await Promise.all([
        fetchProjects(),
        fetchReports(),
        fetchDepartments(),
        fetchComplaints(),
      ]);
      if (!alive) return;
      setProjects(p.data);
      setReports(r.data);
      setDepartments(d.data);
      setComplaints(c.data);
      setSource([p, r, d, c].every((x) => x.source === "supabase") ? "supabase" : "mock");
      setLoadErrors(
        Array.from(new Set([p, r, d, c].map((x) => x.error).filter((e): e is string => !!e)))
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Ask for the user's location
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("granted");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    );
  }, []);

  const grouped = useMemo(() => reportsByProject(reports), [reports]);
  const departmentNames = useMemo(
    () => Array.from(new Set(projects.map((p) => p.department))).sort(),
    [projects]
  );

  const km = useCallback(
    (p: Project) =>
      userLoc ? distanceKm(userLoc.lat, userLoc.lng, p.latitude, p.longitude) : null,
    [userLoc]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (status !== "All" && p.status !== status) return false;
      if (dept !== "All departments" && p.department !== dept) return false;
      if (!q) return true;
      return `${p.title} ${p.street} ${p.department}`.toLowerCase().includes(q);
    });
    const count = (p: Project) => grouped.get(p.id)?.length ?? 0;
    const end = (p: Project) => (p.end_date ? new Date(p.end_date).getTime() : Infinity);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "reports_desc":
          return count(b) - count(a);
        case "reports_asc":
          return count(a) - count(b);
        case "deadline":
          return end(a) - end(b);
        case "title":
          return a.title.localeCompare(b.title);
        default: {
          const da = km(a);
          const db = km(b);
          if (da === null || db === null) return 0;
          return da - db;
        }
      }
    });
  }, [projects, grouped, search, dept, status, sort, km]);

  const notices = useMemo(() => projectsWithNotices(projects), [projects]);

  // --- map / form hand-offs -------------------------------------------------
  const openComplaint = useCallback((prefill?: ReportPrefill) => {
    setComplaintCtx({ key: Date.now(), prefill });
  }, []);
  const openVerify = useCallback((prefill?: ReportPrefill) => {
    setVerifyCtx({ key: Date.now(), prefill });
  }, []);

  const onEmptyPlaceChosen = useCallback(
    async (at: { lat: number; lng: number }) => {
      const street = await reverseGeocode(at.lat, at.lng);
      openComplaint({ street, latitude: at.lat, longitude: at.lng });
    },
    [openComplaint]
  );

  if (view === "authority") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-4xl">🏛️</p>
          <h2 className="mt-4 text-4xl font-bold">
            <span className="text-emerald-700">Municipal Authority View</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Project proposals, clash detection and citizen site reports will appear here.
          </p>
          <p className="mt-6 inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
            Coming soon
          </p>
        </section>
      </main>
    );
  }

  const pill = (s: StatusFilter) => (
    <button
      key={s}
      onClick={() => setStatus(s)}
      className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
        status === s
          ? "bg-emerald-700 text-white"
          : "bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {s}
    </button>
  );

  const field =
    "rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Notices */}
      {source === "mock" && !loading && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
          <strong>Showing demo data.</strong>{" "}
          {loadErrors.length > 0
            ? loadErrors.join(" ")
            : "Supabase keys were not found, so nothing is read from or saved to the database."}
        </div>
      )}

      {notices.length > 0 && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-900">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            <p className="font-semibold">
              ⚠️ {notices.length} active disruption{notices.length === 1 ? "" : "s"} or detour
              {notices.length === 1 ? "" : "s"} near you
            </p>
            <button
              onClick={() => setNoticesOpen((v) => !v)}
              aria-expanded={noticesOpen}
              className="shrink-0 font-semibold underline"
            >
              {noticesOpen ? "Hide" : "View"}
            </button>
          </div>
          {noticesOpen && (
            <ul className="mx-auto mt-3 max-w-[1400px] space-y-1">
              {notices.map((p) => (
                <li key={p.id}>
                  <span className="font-semibold">{p.title}:</span>{" "}
                  {p.status === "Delayed" && p.delay_reason
                    ? `Delayed – ${p.delay_reason}. `
                    : ""}
                  {p.detour ?? ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Map with the complaint / verification tools beside it */}
      <section className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_400px] md:px-6">
        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <h2 className="text-xl font-bold">Neighborhood Public Works Map</h2>
              <p className="text-sm text-slate-500">
                Hover a dot for details, click it to file a report or verify. Click empty ground to
                report there. Double-click to jump to your location.
              </p>
            </div>
          </div>
          <div className="h-[65vh] min-h-[460px] lg:h-[calc(100vh-13rem)]">
            <PublicWorksMap
              projects={projects}
              complaints={complaints}
              reports={reports}
              departments={departments}
              userLocation={userLoc}
              focus={focus}
              onFileReport={openComplaint}
              onVerify={openVerify}
              onEmptyPlaceChosen={onEmptyPlaceChosen}
            />
          </div>
          {geo === "denied" && (
            <p className="mt-2 px-1 text-xs text-slate-500">
              Location is off, so “My location” and double-click recentring are unavailable.
            </p>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold">File a Complaint</h3>
            <p className="mt-1 text-slate-500">
              Recorded and sent directly to the responsible department.
            </p>
            <button
              onClick={() => openComplaint()}
              className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-800"
            >
              File a Complaint
            </button>
          </div>

          <ComplaintLog
            complaints={complaints}
            onSelect={(c) =>
              c.latitude != null &&
              c.longitude != null &&
              setFocus({ lat: c.latitude, lng: c.longitude, key: Date.now() })
            }
          />

          <PhotoUploadModal
            projects={projects}
            onSubmitted={(r) => setReports((prev) => [r, ...prev])}
          />

          <VerificationLog projects={projects} reports={reports} />
        </aside>
      </section>

      {/* Projects affecting you */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-6">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <button
            onClick={() => setListOpen((v) => !v)}
            aria-expanded={listOpen}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <span>
              <span className="block text-3xl font-bold">
                Projects affecting you{" "}
                <span className="text-lg font-semibold text-slate-400">({visible.length})</span>
              </span>
              <span className="mt-1 block text-slate-500">
                {sort === "nearest"
                  ? geo === "granted"
                    ? "Sorted by distance from your location"
                    : geo === "asking"
                      ? "Waiting for your location..."
                      : "Location is off, so distance sorting is unavailable"
                  : sortLabels[sort].replace("Sort: ", "Sorted by: ")}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              {listOpen ? "Minimize" : "Show"}
              <span
                aria-hidden
                className={`inline-block transition-transform ${listOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </span>
          </button>

          {listOpen && (
            <div className="mt-6">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_240px]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by project, street or department"
                  className={field}
                />
                <select value={dept} onChange={(e) => setDept(e.target.value)} className={field}>
                  <option>All departments</option>
                  {departmentNames.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className={field}
                >
                  {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {sortLabels[k]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-1">
                {(["All", "Planned", "In Progress", "Delayed"] as StatusFilter[]).map(pill)}
              </div>

              {loading && <p className="mt-6 text-sm text-slate-500">Loading projects...</p>}
              {!loading && visible.length === 0 && (
                <p className="mt-6 text-sm text-slate-500">
                  {projects.length === 0
                    ? "No projects have been added yet."
                    : "No projects match your filters."}
                </p>
              )}

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {visible.map((p) => {
                  const list = grouped.get(p.id) ?? [];
                  const stalled = stalledReportsLast7Days(list, now);
                  const away = km(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="rounded-2xl border border-slate-200 bg-white p-6 text-left transition hover:border-emerald-600 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-bold leading-snug">{p.title}</h3>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusBadge[p.status]}`}
                          >
                            {p.status}
                          </span>
                          <ReportCount count={list.length} tone={reportTone(list)} />
                        </div>
                      </div>
                      <p className="mt-3 text-slate-600">{p.street}</p>
                      <p className="mt-1 text-slate-500">{p.department}</p>
                      {p.detour && (
                        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          🚧 Detour: {p.detour}
                        </p>
                      )}
                      {stalled > 0 && (
                        <p className="mt-4 text-sm font-semibold text-red-700">
                          {stalled} resident(s) reported no activity this week
                        </p>
                      )}
                      <div className="mt-4 flex justify-between text-sm text-slate-400">
                        <span>{countdownLabel(p.end_date, now)}</span>
                        <span>{away === null ? "" : `${away.toFixed(1)} km away`}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <ProjectDrawer
          project={selected}
          reports={grouped.get(selected.id) ?? []}
          onClose={() => setSelected(null)}
        />
      )}

      {complaintCtx && (
        <ComplaintModal
          key={complaintCtx.key}
          open
          onClose={() => setComplaintCtx(null)}
          departments={departments}
          prefill={complaintCtx.prefill}
          onSubmitted={(c) => {
            setComplaints((prev) => [c, ...prev]);
            if (c.latitude != null && c.longitude != null) {
              setFocus({ lat: c.latitude, lng: c.longitude, key: Date.now() });
            }
          }}
        />
      )}

      {verifyCtx && (
        <VerificationPopup
          key={verifyCtx.key}
          projects={projects}
          prefill={verifyCtx.prefill}
          onSubmitted={(r) => setReports((prev) => [r, ...prev])}
          onClose={() => setVerifyCtx(null)}
        />
      )}
    </main>
  );
}

const toneStyle: Record<ReportTone, string> = {
  stalled: "bg-red-100 text-red-700", // stalled / abandoned
  restored: "bg-green-100 text-green-700", // restored
  active: "bg-slate-100 text-slate-500", // work is happening
  none: "border border-dashed border-slate-200 text-slate-300", // no reports yet
};

const toneMeaning: Record<ReportTone, string> = {
  stalled: "latest report: stalled / abandoned",
  restored: "latest report: restored",
  active: "latest report: work is happening",
  none: "no reports yet",
};

/** Citizen-report count, shown directly under the status badge. */
function ReportCount({ count, tone }: { count: number; tone: ReportTone }) {
  return (
    <span
      title={`${count} citizen report${count === 1 ? "" : "s"} (${toneMeaning[tone]})`}
      aria-label={`${count} citizen reports, ${toneMeaning[tone]}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${toneStyle[tone]}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {count}
    </span>
  );
}
