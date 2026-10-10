"use client";

import { useState } from "react";
import type { Project } from "@/types";

export default function DisruptionBanner({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(true);
  if (!open || projects.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-red-800">⚠ Live disruption notices</p>
        <button
          onClick={() => setOpen(false)}
          aria-label="Dismiss notices"
          className="rounded-md px-2 text-red-700 hover:bg-red-100"
        >
          ✕
        </button>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-red-900">
        {projects.map((p) => (
          <li key={p.id}>
            <span className="font-semibold">{p.street}:</span>{" "}
            {p.detour ?? p.delay_reason ?? "Work in progress"}
          </li>
        ))}
      </ul>
    </div>
  );
}
