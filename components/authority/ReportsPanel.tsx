"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Report = {
  id: number;
  project_id: number | null;
  image_url: string | null;
  ai_status_tag: string;
  notes: string | null;
  upvotes: number | null;
  created_at: string;
  project: { title: string; street: string } | null;
};

const COLLAPSED_COUNT = 5;

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function ReportsPanel() {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [tag, setTag] = useState("All");

  async function load() {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("citizen_reports")
      .select("*, project(title, street)")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else {
      setError(null);
      setRows((data ?? []) as unknown as Report[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const tags = useMemo(
    () => Array.from(new Set(rows.map((r) => r.ai_status_tag))).sort(),
    [rows]
  );

  const filtered = useMemo(
    () => rows.filter((r) => tag === "All" || r.ai_status_tag === tag),
    [rows, tag]
  );
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold">Citizen site reports</h3>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} photo reports across all projects
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="All">All tags</option>
            {tags.map((t) => (
              <option key={t}>{t}</option>
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
        {loading && <p className="text-sm text-slate-500">Loading reports…</p>}
        {!loading && visible.length === 0 && !error && (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No reports {tag === "All" ? "yet" : `tagged "${tag}"`}.
            {tag === "All" && (
              <span className="mt-1 block text-xs text-slate-400">
                If you know rows exist in Supabase, Row Level Security on
                citizen_reports is probably blocking reads.
              </span>
            )}
          </p>
        )}

        {visible.map((r) => (
          <article
            key={r.id}
            className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {r.image_url ? (
              <a href={r.image_url} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image_url}
                  alt={`Report ${r.id}`}
                  className="h-24 w-32 rounded-lg border border-slate-200 object-cover"
                />
              </a>
            ) : (
              <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                No photo
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">#{r.id}</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {r.ai_status_tag}
                </span>
                <span className="text-xs text-slate-400">{fmt(r.created_at)}</span>
                <span className="ml-auto text-xs font-semibold text-slate-600">
                  👍 {r.upvotes ?? 0}
                </span>
              </div>
              <p className="mt-1 font-semibold">
                {r.project?.title ?? "Unlinked project"}
              </p>
              {r.project?.street && (
                <p className="text-xs text-slate-500">📍 {r.project.street}</p>
              )}
              {r.notes && <p className="mt-2 text-sm text-slate-700">{r.notes}</p>}
            </div>
          </article>
        ))}
      </div>

      {filtered.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold hover:bg-slate-100"
        >
          {expanded ? "Show less" : `Show all ${filtered.length} reports`}
        </button>
      )}
    </section>
  );
}
