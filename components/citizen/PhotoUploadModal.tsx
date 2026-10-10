"use client";

import { useEffect, useState } from "react";
import { submitReport } from "@/lib/data";
import { useNow } from "@/lib/useNow";
import { timeAgo } from "@/lib/timeAgo";
import type { CitizenReport, Project, ReportPrefill } from "@/types";
import CappedList from "./CappedList";
import ProjectCombobox from "./ProjectCombobox";

const conditions = {
  stalled: {
    label: "Stalled: Open trench, no workers/machinery",
    tag: "Stalled / Abandoned",
    note: "No machinery or crew visible at the site",
  },
  active: {
    label: "Active: Workers and machinery on site",
    tag: "Active Work",
    note: "Workers and machinery detected on site",
  },
  restored: {
    label: "Restored: Paved tarmac, smooth surface",
    tag: "Restored",
    note: "Surface paved and site cleared",
  },
};

function toneFor(tag: string) {
  if (tag.startsWith("Stalled")) return "bg-red-100 text-red-800";
  if (tag.startsWith("Active")) return "bg-green-100 text-green-800";
  return "bg-amber-100 text-amber-800";
}

const MAX_BYTES = 5 * 1024 * 1024;

/** The "Submit Site Progress Photo" form. Used inline and inside the map popup. */
export default function PhotoUploadModal({
  projects,
  onSubmitted,
  prefill,
}: {
  projects: Project[];
  onSubmitted: (report: CitizenReport) => void;
  /** Details deduced from a map dot: project, department, category, area. */
  prefill?: ReportPrefill;
}) {
  const [projectId, setProjectId] = useState<number | null>(prefill?.projectId ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [condition, setCondition] = useState<keyof typeof conditions>("stalled");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedId = projectId ?? projects[0]?.id ?? null;
  const selected = projects.find((p) => p.id === selectedId) ?? null;

  function onFile(f: File | null) {
    setError(null);
    setNotice(null);
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

  async function run() {
    if (selectedId === null) return setError("There are no projects to report on yet.");
    if (!file) return setError("Please choose a street photo first.");
    const c = conditions[condition];

    setBusy(true);
    setError(null);
    setNotice(null);
    // TODO: replace the simulated condition with a call to /api/verify-photo
    const res = await submitReport({
      project_id: selectedId,
      ai_status_tag: c.tag,
      notes: c.note,
      photo: file,
    });
    setBusy(false);

    if (!res.ok) return setError(res.error);
    onSubmitted(res.report);
    setNotice(res.saved ? "Report submitted. Thank you!" : "Demo mode: report shown here but not saved.");
    setFile(null);
    setFileKey((k) => k + 1); // clears the file input
  }

  const input =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm";

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-bold">Submit Site Progress Photo</h3>
      <p className="mt-1 text-slate-500">
        Visual inspection verifies active work vs stalled trenches
      </p>

      <label className="mt-6 block text-sm font-semibold text-slate-600">
        Select Project
      </label>
      <div className="mt-2">
        <ProjectCombobox
          projects={projects}
          value={selectedId}
          onChange={setProjectId}
          className={input}
        />
      </div>

      {selected && (
        <p className="mt-2 text-xs text-slate-500">
          {selected.department} · {prefill?.projectId === selected.id && prefill.category ? `${prefill.category} · ` : ""}
          {selected.street}
        </p>
      )}

      <label className="mt-5 block text-sm font-semibold text-slate-600">
        Upload Street Photo
      </label>
      <input
        key={fileKey}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className={`${input} mt-2 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700`}
      />

      <label className="mt-5 block text-sm font-semibold text-slate-600">
        Simulate Photo Condition
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
      {notice && <p className="mt-3 text-sm font-medium text-emerald-700">{notice}</p>}

      <button
        onClick={run}
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {busy ? "Submitting..." : "Run Visual Inspection"}
      </button>
    </div>
  );
}

/** The same form, as a popup opened from a map dot. Esc, ✕ or the dark area closes it. */
export function VerificationPopup({
  projects,
  prefill,
  onSubmitted,
  onClose,
}: {
  projects: Project[];
  prefill?: ReportPrefill;
  onSubmitted: (report: CitizenReport) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-3xl shadow-xl">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
        >
          ✕
        </button>
        <PhotoUploadModal projects={projects} prefill={prefill} onSubmitted={onSubmitted} />
      </div>
    </div>
  );
}

/** Latest verification reports. Shows the first 5, the rest on request. */
export function VerificationLog({
  projects,
  reports,
}: {
  projects: Project[];
  reports: CitizenReport[];
}) {
  const now = useNow();
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold">Civic Verification Log</h3>
      <CappedList
        items={reports}
        empty="No reports yet."
        keyOf={(r) => r.id}
        render={(r) => (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">
                {projects.find((p) => p.id === r.project_id)?.title ?? "Unknown project"}
              </p>
              <span className="shrink-0 text-xs text-slate-400">
                {timeAgo(r.created_at, now)}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className={`rounded-lg px-3 py-2 text-xs font-bold ${toneFor(r.ai_status_tag)}`}>
                {r.ai_status_tag}
              </span>
              <p className="text-sm text-slate-600">{r.notes}</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
