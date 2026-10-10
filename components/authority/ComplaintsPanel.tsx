"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUSES = ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"] as const;
type ComplaintStatus = (typeof STATUSES)[number];

type Complaint = {
  id: number;
  citizen_name: string;
  verification_type: string;
  citizen_verification_status: "Pending" | "Verified" | "Rejected";
  complaint_type: string;
  department_id: number;
  street: string;
  description: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  complaint_status: ComplaintStatus;
  created_at?: string | null;
  department?: { name: string } | null;
};

const statusStyle: Record<ComplaintStatus, string> = {
  Submitted: "border-slate-300 bg-slate-100 text-slate-700",
  "Under Review": "border-amber-300 bg-amber-100 text-amber-800",
  "In Progress": "border-blue-300 bg-blue-100 text-blue-800",
  Resolved: "border-emerald-300 bg-emerald-100 text-emerald-800",
  Rejected: "border-red-300 bg-red-100 text-red-700",
};

const verifyStyle: Record<Complaint["citizen_verification_status"], string> = {
  Pending: "bg-amber-100 text-amber-800",
  Verified: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-700",
};

const COLLAPSED_COUNT = 5;

function fmt(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? ""
    : dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function ComplaintsPanel() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<"All" | ComplaintStatus>("All");
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    // Plain select (no embed, no created_at ordering) so a missing column or relationship
    // can never hide the rows. Department names are looked up separately.
    const [compRes, deptRes] = await Promise.all([
      supabase.from("citizen_complaints").select("*").order("id", { ascending: false }),
      supabase.from("department").select("id, name"),
    ]);

    if (compRes.error) {
      console.error("citizen_complaints load failed:", compRes.error);
      setError(`Could not load complaints: ${compRes.error.message}`);
    } else {
      const names = new Map<number, string>(
        (deptRes.data ?? []).map((d: { id: number; name: string }) => [d.id, d.name])
      );
      setError(null);
      setRows(
        ((compRes.data ?? []) as Complaint[]).map((c) => ({
          ...c,
          department: names.has(c.department_id) ? { name: names.get(c.department_id)! } : null,
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: number, next: ComplaintStatus) {
    if (!supabase) return;
    const prev = rows.find((r) => r.id === id)?.complaint_status;
    if (!prev || prev === next) return;

    // Optimistic update, rolled back if the database rejects it
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, complaint_status: next } : r)));
    setSavingId(id);
    const { data, error } = await supabase
      .from("citizen_complaints")
      .update({ complaint_status: next })
      .eq("id", id)
      .select("id");
    setSavingId(null);

    if (error || !data || data.length === 0) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, complaint_status: prev } : r)));
      setError(
        error
          ? `Could not update complaint #${id}: ${error.message}`
          : `Could not update complaint #${id}: no row was changed. Add an UPDATE policy on citizen_complaints (run fix_rls.sql).`
      );
    } else {
      setError(null);
    }
  }

  const filtered = useMemo(
    () => rows.filter((r) => filter === "All" || r.complaint_status === filter),
    [rows, filter]
  );
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold">Citizen complaints</h3>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} total · update the status to keep citizens informed
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "All" | ComplaintStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading complaints…</p>}
        {!loading && visible.length === 0 && !error && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No complaints {filter === "All" ? "yet" : `with status "${filter}"`}.
            {filter === "All" && (
              <span className="mt-1 block text-xs text-slate-400">
                If you know rows exist in Supabase, Row Level Security on
                citizen_complaints is probably blocking reads.
              </span>
            )}
          </p>
        )}

        {visible.map((c) => (
          <article
            key={c.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400">#{c.id}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {c.complaint_type}
                  </span>
                  <span className="text-xs text-slate-400">{fmt(c.created_at)}</span>
                </div>
                <p className="mt-2 font-semibold">
                  {c.citizen_name}{" "}
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    {c.verification_type} ·{" "}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${verifyStyle[c.citizen_verification_status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {c.citizen_verification_status}
                    </span>
                  </span>
                </p>
              </div>

              <label className="flex flex-col items-end gap-1 text-xs text-slate-500">
                Status {savingId === c.id && <span className="text-slate-400">saving…</span>}
                <select
                  value={c.complaint_status}
                  disabled={savingId === c.id}
                  onChange={(e) => changeStatus(c.id, e.target.value as ComplaintStatus)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${statusStyle[c.complaint_status] ?? ""}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mt-3 text-sm text-slate-700">{c.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>📍 {c.street}</span>
              <span>🏛 {c.department?.name ?? "Unassigned"}</span>
              {c.latitude != null && c.longitude != null && (
                <a
                  href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  View on map ↗
                </a>
              )}
            </div>

            {c.image_url && (
              <a href={c.image_url} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image_url}
                  alt={`Complaint ${c.id}`}
                  className="h-24 w-36 rounded-lg border border-slate-200 object-cover"
                />
              </a>
            )}
          </article>
        ))}
      </div>

      {filtered.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold hover:bg-slate-100"
        >
          {expanded ? "Show less" : `Show all ${filtered.length} complaints`}
        </button>
      )}
    </section>
  );
}
