"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import type { ProjectStatus } from "@/types";
import type { LatLng } from "./LocationPicker";

// Leaflet needs the browser, so load the map client-side only
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export type Dept = { id: number; name: string };

// `status_color` is NOT NULL in the database, so derive it from the status
const STATUS_COLOR: Record<ProjectStatus, string> = {
  Planned: "#6B7280",
  "In Progress": "#2563EB",
  Delayed: "#DC2626",
};

const SELECT_COLUMNS =
  "id, title, street, status, budget, contractor, start_date, end_date, delay_reason, detour, verified_stalls, latitude, longitude, department(name)";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600";

export default function AddProjectModal({
  open,
  onClose,
  departments,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  departments: Dept[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreated: (row: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [street, setStreet] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Planned");
  const [budget, setBudget] = useState("");
  const [contractor, setContractor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [delayReason, setDelayReason] = useState("");
  const [detour, setDetour] = useState("");
  const [pos, setPos] = useState<LatLng | null>(null);

  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setTitle("");
    setDepartmentId("");
    setStreet("");
    setStatus("Planned");
    setBudget("");
    setContractor("");
    setStartDate("");
    setEndDate("");
    setDelayReason("");
    setDetour("");
    setPos(null);
    setError(null);
  }

  // Click on map -> set coordinates, then try to auto-fill the street name
  async function handlePick(p: LatLng) {
    setPos(p);
    setLookingUp(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${p.lat}&lon=${p.lng}`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const j = await res.json();
        const a = j.address ?? {};
        const road = a.road ?? a.pedestrian ?? a.neighbourhood ?? "";
        const area = a.suburb ?? a.neighbourhood ?? a.city_district ?? "";
        const guess = [road, area].filter(Boolean).join(", ");
        // Only fill if the user hasn't typed their own value
        if (guess) setStreet((cur) => (cur.trim() ? cur : guess));
      }
    } catch {
      /* ignore: user can type the street manually */
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supabase) return setError("Supabase is not configured.");
    if (!title.trim()) return setError("Title is required.");
    if (!departmentId) return setError("Please choose a department.");
    if (!street.trim()) return setError("Street is required.");
    if (!pos) return setError("Click on the map to choose the project location.");
    if (startDate && endDate && endDate < startDate)
      return setError("End date cannot be before the start date.");

    setSaving(true);
    const { data, error: dbError } = await supabase
      .from("project")
      .insert({
        title: title.trim(),
        department_id: Number(departmentId),
        street: street.trim(),
        status,
        status_color: STATUS_COLOR[status],
        budget: budget.trim() || null,
        contractor: contractor.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        delay_reason: status === "Delayed" ? delayReason.trim() || null : null,
        detour: detour.trim() || null,
        latitude: pos.lat,
        longitude: pos.lng,
      })
      .select(SELECT_COLUMNS)
      .single();
    setSaving(false);

    if (dbError) return setError(dbError.message);

    onCreated(data);
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">Add new project</h3>
            <p className="mt-1 text-sm text-slate-500">
              Fill in the details and click the map to set the location.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Title *" className="md:col-span-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stormwater drain construction – Anna Salai"
              className={inputCls}
            />
          </Field>

          <Field label="Department *">
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputCls}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status *">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className={inputCls}
            >
              <option>Planned</option>
              <option>In Progress</option>
              <option>Delayed</option>
            </select>
          </Field>

          <Field label="Budget">
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. ₹21.7 Lakh"
              className={inputCls}
            />
          </Field>

          <Field label="Contractor">
            <input
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="End date">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          {status === "Delayed" && (
            <Field label="Delay reason" className="md:col-span-2">
              <input
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                className={inputCls}
              />
            </Field>
          )}

          <Field label="Detour / traffic note" className="md:col-span-2">
            <input
              value={detour}
              onChange={(e) => setDetour(e.target.value)}
              placeholder="e.g. Use Mount Road service lane"
              className={inputCls}
            />
          </Field>

          <Field
            label={`Location * ${lookingUp ? "(finding street…)" : ""}`}
            className="md:col-span-2"
          >
            <LocationPicker value={pos} onChange={handlePick} />
            <p className="mt-2 text-xs text-slate-500">
              {pos
                ? `Selected: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)} (drag the pin to adjust)`
                : "Click anywhere on the map to drop a pin."}
            </p>
          </Field>

          <Field label="Street / area *" className="md:col-span-2">
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Auto-filled from the map; edit if needed"
              className={inputCls}
            />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
