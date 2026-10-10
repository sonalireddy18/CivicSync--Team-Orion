"use client";

import { useEffect, useMemo, useState } from "react";
import { useView } from "@/components/layout/ViewProvider";
import PublicWorksMap from "@/components/map/PublicWorksMap";
import ProjectDrawer, { statusBadge } from "@/components/map/ProjectDrawer";
import PhotoUploadModal from "@/components/citizen/PhotoUploadModal";
import ComplaintModal from "@/components/citizen/ComplaintModal";
import DisruptionBanner from "@/components/layout/DisruptionBanner";
import { fetchDepartments, fetchProjects, fetchReports } from "@/lib/data";
import type { Source } from "@/lib/data";
import {
  countdownLabel,
  projectsWithNotices,
  stalledReportsLast7Days,
} from "@/lib/projectUtils";
import { useNow } from "@/lib/useNow";
import type { CitizenReport, Department, Project, ProjectStatus } from "@/types";

const statuses: ("All" | ProjectStatus)[] = ["All", "Planned", "In Progress", "Delayed"];

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ProjectsPage() {
  const { view } = useView();
  const now = useNow();

  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<Source>("mock");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ProjectStatus>("All");
  const [dept, setDept] = useState("All");
  const [sort, setSort] = useState<"nearest" | "ending">("nearest");
  const [selected, setSelected] = useState<Project | null>(null);
  const [complaintOpen, setComplaintOpen] = useState(false);

  // Load everything from Supabase (falls back to demo data if unavailable)
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProjects(), fetchReports(), fetchDepartments()]).then(
      ([p, r, d]) => {
        if (cancelled) return;
        setProjects(p.data);
        setReports(r.data);
        setDepartments(d.data);
        setSource(p.source);
        setLoadError(p.error ?? r.error ?? d.error ?? null);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      return setGeoMsg("Location is not supported by this browser.");
    }
    setGeoMsg("Waiting for location permission...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoMsg(null);
      },
      () =>
        setGeoMsg(
          "Location access was denied. Projects are shown without distance sorting."
        ),
      { timeout: 10000 }
    );
  }

  // Prompt for location as soon as the page opens
  useEffect(() => {
    requestLocation();
  }, []);

  const stalledCount = (projectId: number) =>
    stalledReportsLast7Days(
      reports.filter((r) => r.project_id === projectId),
      now
    );

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = projects
      .filter((p) => status === "All" || p.status === status)
      .filter((p) => dept === "All" || p.department === dept)
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.street.toLowerCase().includes(q)
      )
      .map((p) => ({
        p,
        km: coords ? distanceKm(coords.lat, coords.lon, p.latitude, p.longitude) : null,
      }));

    rows.sort((a, b) => {
      if (sort === "ending") {
        return (a.p.end_date ?? "9999").localeCompare(b.p.end_date ?? "9999");
      }
      if (a.km === null || b.km === null) return 0;
      return a.km - b.km;
    });
    return rows;
  }, [projects, search, status, dept, sort, coords]);

  if (view === "authority") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-24 text-center text-slate-900">
        <h2 className="text-3xl font-bold">Municipal Authority View</h2>
        <p className="mt-3 text-slate-600">
          The authority dashboard (project proposals and clash detection) is coming soon.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        {!loading && source === "mock" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span className="font-semibold">Showing demo data.</span>{" "}
            {loadError
              ? `Could not read from the database: ${loadError}`
              : "The database is not connected (check .env.local)."}
          </div>
        )}

        <div className="mb-6">
          <DisruptionBanner projects={projectsWithNotices(projects)} />
        </div>

        <h2 className="text-3xl font-bold">
          Public <span className="text-emerald-700">Works Map</span>
        </h2>
        <p className="mt-2 text-slate-600">
          See what is being built, repaired or delayed near you.
        </p>

        <div className="mt-6">
          <PublicWorksMap />
        </div>

        {/* Projects near you */}
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold">Projects affecting you</h3>
              <p className="mt-1 text-sm text-slate-500">
                {coords
                  ? "Sorted by distance from your location"
                  : "Allow location access to see the closest projects first"}
              </p>
            </div>
            {!coords && (
              <button
                onClick={requestLocation}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                📍 Use my location
              </button>
            )}
          </div>
          {geoMsg && <p className="mt-2 text-sm text-amber-700">{geoMsg}</p>}

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project or street"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm md:col-span-2"
            />
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="All">All departments</option>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "nearest" | "ending")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="nearest">Sort: Nearest first</option>
              <option value="ending">Sort: Ending soonest</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  status === s
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {loading && <p className="text-sm text-slate-500">Loading projects...</p>}
            {!loading && list.length === 0 && (
              <p className="text-sm text-slate-500">
                {projects.length === 0
                  ? "No projects have been added yet."
                  : "No projects match your filters."}
              </p>
            )}
            {list.map(({ p, km }) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-bold">{p.title}</h4>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{p.street}</p>
                <p className="mt-1 text-sm text-slate-500">{p.department}</p>
                {p.detour && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    🚧 Detour: {p.detour}
                  </p>
                )}
                {stalledCount(p.id) > 0 && (
                  <p className="mt-2 text-xs font-semibold text-red-700">
                    {stalledCount(p.id)} resident(s) reported no activity this week
                  </p>
                )}
                <div className="mt-4 flex justify-between text-xs text-slate-400">
                  <span>{countdownLabel(p.end_date, now)}</span>
                  {km !== null && <span>{km.toFixed(1)} km away</span>}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Photo verification + complaint */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold">Report &amp; verify</h3>
          <p className="mt-1 text-sm text-slate-500">
            Help keep public works accountable.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PhotoUploadModal
                projects={projects}
                reports={reports}
                onSubmitted={(r) => setReports((prev) => [r, ...prev])}
              />
            </div>

            <div className="h-fit rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Have a grievance?</h3>
              <p className="mt-2 text-sm text-slate-600">
                File a complaint with your name and ID verification. It is recorded and emailed
                straight to the responsible department.
              </p>
              <button
                onClick={() => setComplaintOpen(true)}
                className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-800"
              >
                File a Complaint
              </button>
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <ProjectDrawer
          project={selected}
          reports={reports.filter((r) => r.project_id === selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
      <ComplaintModal
        open={complaintOpen}
        onClose={() => setComplaintOpen(false)}
        departments={departments}
      />
    </main>
  );
}
