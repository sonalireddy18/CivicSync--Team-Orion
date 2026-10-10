"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { statusBadge } from "@/components/map/ProjectDrawer";
import AddProjectModal, { type Dept } from "@/components/authority/AddProjectModal";
import ComplaintsPanel from "@/components/authority/ComplaintsPanel";
import ReportsPanel from "@/components/authority/ReportsPanel";
import CoordinationClashesPanel from "@/components/authority/CoordinationClashesPanel";
import type { ProjectStatus } from "@/types";

type MapProject = {
  id: number;
  title: string;
  street: string;
  status: string;
  budget: string | null;
  latitude: number;
  longitude: number;
};

type Row = {
  id: number;
  title: string;
  street: string;
  status: ProjectStatus;
  budget: string | null;
  contractor: string | null;
  start_date: string | null;
  end_date: string | null;
  delay_reason: string | null;
  detour: string | null;
  verified_stalls: number | null;
  latitude: number | null;
  longitude: number | null;
  department: { name: string } | null;
};

const statuses: ("All" | ProjectStatus)[] = ["All", "Planned", "In Progress", "Delayed"];

export default function AuthorityProjects() {
  const [rows, setRows] = useState<Row[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Leaflet touches `window` when imported, so only import it in the browser, after mount
  const [MapView, setMapView] = useState<React.ComponentType<{ projects: MapProject[] }> | null>(
    null
  );
  useEffect(() => {
    import("@/components/authority/AuthorityMap").then((m) => setMapView(() => m.default));
  }, []);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ProjectStatus>("All");
  const [dept, setDept] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        setError(
          "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart the dev server."
        );
        setLoading(false);
        return;
      }
      const [projRes, deptRes] = await Promise.all([
        supabase
          .from("project")
          .select(
            "id, title, street, status, budget, contractor, start_date, end_date, delay_reason, detour, verified_stalls, latitude, longitude, department(name)"
          )
          .order("id", { ascending: false }),
        supabase.from("department").select("id, name").order("name"),
      ]);

      if (cancelled) return;
      if (projRes.error) setError(projRes.error.message);
      else setRows((projRes.data ?? []) as unknown as Row[]);
      if (deptRes.data) setDepartments(deptRes.data as Dept[]);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCreated(row: Row) {
    setRows((prev) => [row, ...prev]);
    setToast(`Project "${row.title}" added.`);
    setTimeout(() => setToast(null), 4000);
  }

  const deptNames = useMemo(
    () =>
      Array.from(
        new Set(rows.map((r) => r.department?.name).filter(Boolean) as string[])
      ).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => status === "All" || r.status === status)
      .filter((r) => dept === "All" || r.department?.name === dept)
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.street.toLowerCase().includes(q) ||
          (r.contractor ?? "").toLowerCase().includes(q)
      );
  }, [rows, search, status, dept]);

  // Only projects with coordinates can be pinned; follows the active filters
  const mapProjects = useMemo(
    () =>
      filtered.filter((r) => r.latitude != null && r.longitude != null) as unknown as MapProject[],
    [filtered]
  );

  const COLLAPSED_COUNT = 5;
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  const count = (s: ProjectStatus) => rows.filter((r) => r.status === s).length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">
              Municipal <span className="text-emerald-700">Dashboard</span>
            </h2>
            <p className="mt-2 text-slate-600">All public works projects in the database.</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            disabled={!supabase}
            className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
          >
            + Add project
          </button>
        </div>

        {toast && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {toast}
          </p>
        )}

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total" value={rows.length} />
          <Stat label="Planned" value={count("Planned")} />
          <Stat label="In Progress" value={count("In Progress")} />
          <Stat label="Delayed" value={count("Delayed")} />
        </div>

        {/* Filters */}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, street or contractor"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm md:col-span-2"
          />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="All">All departments</option>
            {deptNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "All" | ProjectStatus)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Could not load projects: {error}
          </p>
        )}

        {/* Map */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Works map</h3>
            <div className="flex gap-4 text-xs text-slate-600">
              <Legend color="#16a34a" label="Planned" />
              <Legend color="#f97316" label="In Progress" />
              <Legend color="#dc2626" label="Delayed" />
            </div>
          </div>
          {MapView ? (
            <MapView projects={mapProjects} />
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
              Loading map…
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {mapProjects.length} of {filtered.length} matching projects have a location. Filters above apply to the map.
          </p>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <Th>ID</Th>
                <Th>Title</Th>
                <Th>Department</Th>
                <Th>Street</Th>
                <Th>Status</Th>
                <Th>Budget</Th>
                <Th>Contractor</Th>
                <Th>Start</Th>
                <Th>End</Th>
                <Th>Delay reason</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Loading projects…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && !error && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No projects found.
                  </td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-400">{r.id}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-slate-600">{r.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.street}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[r.status] ?? ""}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{r.budget ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.contractor ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {r.start_date ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {r.end_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.delay_reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {visible.length} of {filtered.length} matching projects ({rows.length} total)
          </p>
        )}

        {filtered.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold hover:bg-slate-100"
          >
            {expanded ? "Show less" : `Show all ${filtered.length} projects`}
          </button>
        )}

        <CoordinationClashesPanel />
        <ComplaintsPanel />
        <ReportsPanel />
      </div>

      <AddProjectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        departments={departments}
        onCreated={handleCreated}
      />
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
