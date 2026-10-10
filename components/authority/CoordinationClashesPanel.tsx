"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Clash = {
  id: number;
  project_a_id: number | null;
  project_b_id: number | null;
  street: string;
  ai_severity: string;
  ai_recommendation: string;
  created_at: string;
};

const COLLAPSED_COUNT = 5;

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function severityStyle(s: string) {
  const v = s.toLowerCase();
  if (v.includes("high") || v.includes("critical")) return "bg-red-100 text-red-700";
  if (v.includes("med")) return "bg-amber-100 text-amber-800";
  if (v.includes("low")) return "bg-emerald-100 text-emerald-800";
  return "bg-slate-100 text-slate-700";
}

export default function CoordinationClashesPanel() {
  const [rows, setRows] = useState<Clash[]>([]);
  const [titles, setTitles] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [severity, setSeverity] = useState("All");

  async function load() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    // Two plain queries (instead of an embed) because the table has two foreign keys to project
    const [clashRes, projRes] = await Promise.all([
      supabase.from("coordination_clash").select("*").order("created_at", { ascending: false }),
      supabase.from("project").select("id, title"),
    ]);

    if (clashRes.error) setError(clashRes.error.message);
    else {
      setError(null);
      setRows((clashRes.data ?? []) as Clash[]);
    }
    if (projRes.data) {
      setTitles(Object.fromEntries(projRes.data.map((p: { id: number; title: string }) => [p.id, p.title])));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const severities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.ai_severity))).sort(),
    [rows]
  );
  const filtered = useMemo(
    () => rows.filter((r) => severity === "All" || r.ai_severity === severity),
    [rows, severity]
  );
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  const name = (id: number | null) => (id == null ? "—" : titles[id] ?? `Project #${id}`);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold">Coordination clashes</h3>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} overlapping works detected between projects
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="All">All severities</option>
            {severities.map((s) => (
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
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load clashes: {error}
        </p>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <Th>ID</Th>
              <Th>Project A</Th>
              <Th>Project B</Th>
              <Th>Street</Th>
              <Th>Severity</Th>
              <Th>Recommendation</Th>
              <Th>Detected</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading clashes…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No clashes found.
                </td>
              </tr>
            )}
            {visible.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400">{c.id}</td>
                <td className="px-4 py-3 font-medium">{name(c.project_a_id)}</td>
                <td className="px-4 py-3 font-medium">{name(c.project_b_id)}</td>
                <td className="px-4 py-3 text-slate-600">{c.street}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyle(c.ai_severity)}`}
                  >
                    {c.ai_severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.ai_recommendation}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmt(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold hover:bg-slate-100"
        >
          {expanded ? "Show less" : `Show all ${filtered.length} clashes`}
        </button>
      )}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}
