"use client";

import { useState } from "react";
import data from "@/data/mockProjects.json";
import type { Project } from "@/types";

type Log = { title: string; tag: string; note: string; when: string; tone: "red" | "green" | "amber" };

const conditions = {
  stalled: {
    label: "Stalled: Open trench, no workers/machinery",
    tag: "Stalled / Abandoned",
    note: "No machinery or crew visible at the site",
    tone: "red" as const,
  },
  active: {
    label: "Active: Workers and machinery on site",
    tag: "Active Work",
    note: "Workers and machinery detected on site",
    tone: "green" as const,
  },
  restored: {
    label: "Restored: Paved tarmac, smooth surface",
    tag: "Restored",
    note: "Surface paved and site cleared",
    tone: "amber" as const,
  },
};

const tone = {
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
};

const MAX_BYTES = 5 * 1024 * 1024;

export default function PhotoUploadModal() {
  const projects = data.projects as Project[];
  const [projectId, setProjectId] = useState<number>(projects[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [condition, setCondition] = useState<keyof typeof conditions>("stalled");
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<Log[]>([
    {
      title: "Underground Storm Water Drainage Laying",
      tag: "Stalled / Abandoned",
      note: "No machinery or crew seen for 5 consecutive days",
      when: "2 hours ago",
      tone: "red",
    },
    {
      title: "PWD Road Resurfacing & Bitumen Topping",
      tag: "Active Work",
      note: "Bitumen pavers active on eastern lane",
      when: "Yesterday",
      tone: "green",
    },
  ]);

  function onFile(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setFile(null);
      return setError("Only JPG, PNG or WebP images are allowed.");
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      return setError("Image must be 5 MB or smaller.");
    }
    setFile(f);
  }

  function run() {
    if (!file) return setError("Please choose a street photo first.");
    const p = projects.find((x) => x.id === projectId)!;
    const c = conditions[condition];
    // TODO: replace with POST /api/verify-photo
    setLog([
      { title: p.title, tag: c.tag, note: c.note, when: "Just now", tone: c.tone },
      ...log,
    ]);
    setFile(null);
    setError(null);
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold">Submit Site Progress Photo</h3>
        <p className="mt-1 text-slate-500">
          AI visual inspection verifies active work vs stalled trenches
        </p>

        <label className="mt-6 block text-sm font-semibold text-slate-600">
          Select Project
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(Number(e.target.value))}
          className={`${input} mt-2`}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.street})
            </option>
          ))}
        </select>

        <label className="mt-5 block text-sm font-semibold text-slate-600">
          Upload Street Photo
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className={`${input} mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700`}
        />

        <label className="mt-5 block text-sm font-semibold text-slate-600">
          Simulate AI Photo Condition
        </label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as keyof typeof conditions)}
          className={`${input} mt-2`}
        >
          {Object.entries(conditions).map(([k, c]) => (
            <option key={k} value={k}>
              {c.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          onClick={run}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3.5 font-semibold text-white transition hover:bg-slate-800"
        >
          Run AI Visual Inspection
        </button>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Civic Verification Log</h3>
        <div className="mt-5 space-y-3">
          {log.map((l, i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold">{l.title}</p>
                <span className="shrink-0 text-xs text-slate-400">{l.when}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className={`rounded-lg px-3 py-2 text-xs font-bold ${tone[l.tone]}`}>
                  {l.tag}
                </span>
                <p className="text-sm text-slate-600">{l.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
