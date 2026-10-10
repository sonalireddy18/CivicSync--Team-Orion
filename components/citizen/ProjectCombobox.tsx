"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/types";

/**
 * A drop-down you can type into. Typing filters the list by title, street or
 * department; arrow keys + Enter, or a click, pick a project.
 */
export default function ProjectCombobox({
  projects,
  value,
  onChange,
  className = "",
}: {
  projects: Project[];
  value: number | null;
  onChange: (id: number) => void;
  className?: string;
}) {
  const selected = projects.find((p) => p.id === value) ?? null;
  const labelOf = (p: Project) => `${p.title} (${p.street})`;

  const [text, setText] = useState(selected ? labelOf(selected) : "");
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false); // false = show the full list
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  // Keep the text in step when the selection changes from outside (e.g. a map dot)
  useEffect(() => {
    setText(selected ? labelOf(selected) : "");
    setTyping(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selected?.title]);

  const matches = useMemo(() => {
    const q = typing ? text.trim().toLowerCase() : "";
    if (!q) return projects;
    return projects.filter((p) =>
      `${p.title} ${p.street} ${p.department}`.toLowerCase().includes(q)
    );
  }, [projects, text, typing]);

  // Close when clicking elsewhere and restore the chosen project's name
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) {
        setOpen(false);
        setTyping(false);
        setText(selected ? labelOf(selected) : "");
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function pick(p: Project) {
    onChange(p.id);
    setText(labelOf(p));
    setTyping(false);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && matches[active]) {
        e.preventDefault();
        pick(matches[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setTyping(false);
      setText(selected ? labelOf(selected) : "");
    }
  }

  return (
    <div ref={box} className="relative">
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setTyping(true);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onKeyDown={onKey}
        placeholder="Type to search projects..."
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        className={`${className} pr-10`}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
        ▾
      </span>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {matches.length === 0 && (
            <li className="px-4 py-3 text-slate-500">No projects match “{text}”.</li>
          )}
          {matches.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={p.id === value}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-4 py-2.5 ${
                i === active ? "bg-emerald-50" : ""
              } ${p.id === value ? "font-semibold text-emerald-800" : "text-slate-700"}`}
            >
              {p.title}
              <span className="block text-xs text-slate-400">
                {p.street} · {p.department}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
