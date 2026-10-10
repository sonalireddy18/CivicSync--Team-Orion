"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CitizenReport, Project } from "@/types";
import { countdownLabel, stalledReportsLast7Days } from "@/lib/projectUtils";
import { useNow } from "@/lib/useNow";

export const statusBadge: Record<string, string> = {
  Planned: "bg-green-100 text-green-800",
  "In Progress": "bg-orange-100 text-orange-800",
  Delayed: "bg-red-100 text-red-800",
};

export default function ProjectDrawer({
  project,
  reports,
  onClose,
}: {
  project: Project;
  reports: CitizenReport[];
  onClose: () => void;
}) {
  const router = useRouter();
  const now = useNow();
  const stalled = stalledReportsLast7Days(reports, now);
  const [tab, setTab] = useState<"info" | "reports">("info");
  const [promptReport, setPromptReport] = useState<CitizenReport | null>(null);

  function openReport(r: CitizenReport) {
    if (r.conversation_id) {
      router.push(`/conversations?thread=${r.conversation_id}`);
    } else {
      setPromptReport(r);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">{project.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{project.street}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 flex gap-2 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setTab("info")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === "info" ? "bg-emerald-700 text-white" : "text-slate-600"
            }`}
          >
            Municipality Info
          </button>
          <button
            onClick={() => setTab("reports")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === "reports" ? "bg-emerald-700 text-white" : "text-slate-600"
            }`}
          >
            Citizen Reports ({reports.length})
          </button>
        </div>

        {tab === "info" && stalled > 0 && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            {stalled} resident{stalled === 1 ? "" : "s"} reported no work
            activity in the past 7 days
          </div>
        )}

        {tab === "info" && (
          <dl className="mt-6 space-y-4 text-sm">
            <Row label="Status">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[project.status]}`}
              >
                {project.status}
              </span>
            </Row>
            <Row label="Department">{project.department}</Row>
            <Row label="Budget">{project.budget ?? "Not disclosed"}</Row>
            <Row label="Contractor">{project.contractor ?? "Not assigned"}</Row>
            <Row label="Start date">{project.start_date ?? "—"}</Row>
            <Row label="End date">{project.end_date ?? "—"}</Row>
            <Row label="Deadline">{countdownLabel(project.end_date, now)}</Row>
            {project.delay_reason && (
              <Row label="Delay reason">{project.delay_reason}</Row>
            )}
            {project.detour && <Row label="Detour">{project.detour}</Row>}
          </dl>
        )}

        {tab === "reports" && (
          <div className="mt-6 space-y-3">
            {reports.length === 0 && (
              <p className="text-sm text-slate-500">
                No citizen reports for this project yet.
              </p>
            )}
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => openReport(r)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-600"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                    {r.ai_status_tag ?? "Untagged"}
                  </span>
                  <span className="text-xs text-slate-400">
                    👍 {r.upvotes} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{r.notes}</p>
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  {r.conversation_id
                    ? "View conversation →"
                    : "No conversation yet"}
                </p>
              </button>
            ))}
          </div>
        )}

        {promptReport && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              No conversation on this report yet.
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Would you like to start one?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() =>
                  router.push(
                    `/conversations?new=1&project=${project.id}&report=${promptReport.id}`
                  )
                }
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Start conversation
              </button>
              <button
                onClick={() => setPromptReport(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}
