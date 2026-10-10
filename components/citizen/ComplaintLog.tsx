"use client";

import type { ComplaintRecord } from "@/types";
import { useNow } from "@/lib/useNow";
import { timeAgo } from "@/lib/timeAgo";
import CappedList from "./CappedList";

function statusTone(status: string) {
  if (status === "Resolved") return "bg-green-100 text-green-800";
  if (status === "Rejected") return "bg-slate-200 text-slate-700";
  if (status === "In Progress") return "bg-orange-100 text-orange-800";
  return "bg-blue-100 text-blue-800"; // Submitted / Under Review
}

/** Complaints filed by other citizens. Shows the first 5, the rest on request. */
export default function ComplaintLog({
  complaints,
  onSelect,
}: {
  complaints: ComplaintRecord[];
  onSelect?: (c: ComplaintRecord) => void;
}) {
  const now = useNow();

  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold">Citizen Complaint Log</h3>
      <CappedList
        items={complaints}
        empty="No complaints yet."
        keyOf={(c) => c.id}
        render={(c) => (
          <button
            type="button"
            onClick={() => onSelect?.(c)}
            disabled={!onSelect || c.latitude == null}
            title={c.latitude != null ? "Show on map" : undefined}
            className="w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-left enabled:hover:border-emerald-600 disabled:cursor-default"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold">{c.complaint_type}</p>
              <span className="shrink-0 text-xs text-slate-400">
                {timeAgo(c.created_at, now)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {c.street} · {c.department}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>
            <span
              className={`mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-bold ${statusTone(
                c.complaint_status
              )}`}
            >
              {c.complaint_status}
            </span>
          </button>
        )}
      />
    </div>
  );
}
