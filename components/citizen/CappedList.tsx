"use client";

import { useState } from "react";

/**
 * Shows the first `cap` items; the rest are tucked behind a
 * "Show N more" button and can be minimized again.
 */
export default function CappedList<T>({
  items,
  cap = 5,
  empty,
  render,
  keyOf,
}: {
  items: T[];
  cap?: number;
  empty: string;
  render: (item: T) => React.ReactNode;
  keyOf: (item: T) => string | number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, cap);
  const hidden = items.length - cap;

  return (
    <div className="mt-5 space-y-3">
      {items.length === 0 && <p className="text-sm text-slate-500">{empty}</p>}
      {visible.map((item) => (
        <div key={keyOf(item)}>{render(item)}</div>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          {expanded ? "Show less" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  );
}
