"use client";

import { useEffect, useState } from "react";
import { buildComplaintGmailUrl } from "@/lib/email";
import { submitComplaint } from "@/lib/data";
import type {
  ComplaintCategory,
  ComplaintInput,
  ComplaintRecord,
  Department,
  ReportPrefill,
  VerificationType,
} from "@/types";

const categories: ComplaintCategory[] = [
  "Road / Drainage",
  "Pipes",
  "Electricity",
  "Network Towers",
];

const idRules: Record<
  VerificationType,
  { label: string; hint: string; clean: (v: string) => string; test: (v: string) => boolean }
> = {
  Aadhaar: {
    label: "Aadhaar number",
    hint: "12 digits, cannot start with 0 or 1",
    clean: (v) => v.replace(/\D/g, "").slice(0, 12),
    test: (v) => /^[2-9][0-9]{11}$/.test(v),
  },
  "PAN Card": {
    label: "PAN number",
    hint: "Format: ABCDE1234F",
    clean: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
    test: (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v),
  },
  "Drivers License": {
    label: "Driving licence number",
    hint: "Format: TN0120110012345 (state code, RTO, year, number)",
    clean: (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16),
    test: (v) => /^[A-Z]{2}[0-9]{2}(19|20)[0-9]{2}[0-9]{7}$/.test(v),
  },
};

type Errors = Partial<Record<string, string>>;

const MAX_BYTES = 5 * 1024 * 1024;

export default function ComplaintModal({
  open,
  onClose,
  departments,
  prefill,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  departments: Department[];
  /** Details deduced from a map dot or map click: category, department, area, coordinates. */
  prefill?: ReportPrefill;
  onSubmitted?: (complaint: ComplaintRecord) => void;
}) {
  const [name, setName] = useState("");
  const [vType, setVType] = useState<VerificationType>("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>(
    prefill?.category ?? "Road / Drainage"
  );
  const [departmentId, setDepartmentId] = useState<number | null>(
    prefill?.departmentId ?? null
  );
  const [street, setStreet] = useState(prefill?.street ?? "");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ saved: boolean; gmailUrl: string } | null>(null);

  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const rule = idRules[vType];

  // Only departments that handle this category (the database enforces this too)
  const matching = departments.filter((d) => d.dept_category === category);
  let available = matching.length > 0 ? matching : departments;
  const preDept =
    prefill?.departmentId != null
      ? departments.find((d) => d.id === prefill.departmentId)
      : undefined;
  if (preDept && !available.some((d) => d.id === preDept.id)) {
    available = [preDept, ...available];
  }
  const selectedDept = available.find((d) => d.id === departmentId) ?? available[0];

  function validate(): Errors {
    const e: Errors = {};
    const n = name.trim();
    if (n.length < 2 || n.length > 80) e.name = "Enter your full name (2–80 characters).";
    else if (/[0-9!@#$%^&*()_+=[\]{};:"\\|,<>/?~`]/.test(n))
      e.name = "Name cannot contain numbers or special symbols.";
    if (!rule.test(idNumber)) e.idNumber = `Enter a valid ${rule.label.toLowerCase()}. ${rule.hint}`;
    if (street.trim().length < 3) e.street = "Enter the street or area (min 3 characters).";
    const d = description.trim();
    if (d.length < 20) e.description = "Please describe the issue in at least 20 characters.";
    else if (d.length > 1000) e.description = "Description must be 1000 characters or fewer.";
    if (photo) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type))
        e.photo = "Only JPG, PNG or WebP images are allowed.";
      else if (photo.size > MAX_BYTES) e.photo = "Image must be 5 MB or smaller.";
    }
    if (!consent) e.consent = "You must confirm the details are true.";
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!selectedDept) {
      return setSubmitError("Departments are still loading. Please try again in a moment.");
    }

    const payload: ComplaintInput = {
      citizen_name: name.trim(),
      verification_type: vType,
      category,
      street: street.trim(),
      description: description.trim(),
      department: selectedDept.name,
      latitude: prefill?.latitude ?? null,
      longitude: prefill?.longitude ?? null,
    };

    // Open the Gmail tab now, while the click is still fresh, so the browser
    // doesn't block it as a pop-up. It is pointed at Gmail once the save works.
    const gmailTab = window.open("about:blank", "_blank");

    setBusy(true);
    setSubmitError(null);
    // The ID number is only checked for format above. It is never saved or emailed.
    const res = await submitComplaint(payload, selectedDept.id, photo);
    setBusy(false);

    if (!res.ok) {
      gmailTab?.close();
      return setSubmitError(res.error);
    }

    const gmailUrl = buildComplaintGmailUrl(selectedDept.contact_email, payload);
    if (gmailTab) {
      gmailTab.opener = null;
      gmailTab.location.href = gmailUrl;
    }
    setSent({ saved: res.saved, gmailUrl });
    const complaint: ComplaintRecord = {
  id: Date.now(),
  complaint_type: payload.category,
  department_id: selectedDept.id,
  department: selectedDept.name,
  street: payload.street,
  description: payload.description,
  latitude: payload.latitude ?? null,
  longitude: payload.longitude ?? null,
  complaint_status: "Pending",
  created_at: new Date().toISOString(),
};

onSubmitted?.(complaint);
  }

  function close() {
    setSent(null);
    setErrors({});
    setSubmitError(null);
    setIdNumber("");
    setConsent(false);
    onClose();
  }

  const input = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm";
  const label = "block text-sm font-semibold text-slate-600";
  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs font-medium text-red-600">{errors[k]}</p> : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        // Click on the dark backdrop closes the popup
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-3xl bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
          <div>
            <h3 className="text-2xl font-bold">File a Complaint</h3>
            <p className="mt-1 text-sm text-slate-500">
              Recorded and sent directly to the responsible department.
            </p>
          </div>
          <button onClick={close} aria-label="Close" className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-6 pt-0">
        {sent ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900">
            <p className="font-semibold">
              {sent.saved
                ? "Your complaint has been recorded."
                : "Demo mode: your complaint was not saved to a database."}
            </p>
            <p className="mt-2">
              Gmail should have opened in a new tab with the complaint prefilled. Press send there
              to notify the department.
            </p>
            <a
              href={sent.gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold text-emerald-800 underline"
            >
              Gmail didn’t open? Open it here
            </a>
            <button onClick={close} className="mt-4 block rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            {prefill?.latitude != null && prefill.longitude != null && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                📍 Pinned on the map at {prefill.latitude.toFixed(5)}, {prefill.longitude.toFixed(5)}.
                Category, department and area are filled in from the map. Change them if needed.
              </p>
            )}
            <div>
              <label className={label}>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={input} placeholder="As on your ID" />
              {err("name")}
            </div>

            <div>
              <span className={label}>Verify identity with</span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(idRules) as VerificationType[]).map((t) => (
                  <label
                    key={t}
                    className={`cursor-pointer rounded-xl border px-3 py-3 text-center text-sm font-medium ${
                      vType === t
                        ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vtype"
                      className="sr-only"
                      checked={vType === t}
                      onChange={() => {
                        setVType(t);
                        setIdNumber("");
                      }}
                    />
                    {t === "Drivers License" ? "Driver's License" : t}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={label}>{rule.label}</label>
              <input
                value={idNumber}
                onChange={(e) => setIdNumber(rule.clean(e.target.value))}
                inputMode={vType === "Aadhaar" ? "numeric" : "text"}
                autoComplete="off"
                className={input}
                placeholder={rule.hint}
              />
              <p className="mt-1 text-xs text-slate-400">
                Used only to check the format. It is not stored or sent to the department.
              </p>
              {err("idNumber")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ComplaintCategory);
                    setDepartmentId(null);
                  }}
                  className={input}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Department</label>
                <select
                  value={selectedDept?.id ?? ""}
                  onChange={(e) => setDepartmentId(Number(e.target.value))}
                  className={input}
                >
                  {available.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={label}>Street / area</label>
              <input value={street} onChange={(e) => setStreet(e.target.value)} maxLength={120} className={input} />
              {err("street")}
            </div>

            <div>
              <label className={label}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} className={input} />
              <p className="mt-1 text-right text-xs text-slate-400">{description.length}/1000</p>
              {err("description")}
            </div>

            <div>
              <label className={label}>Photo (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className={`${input} file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700`}
              />
              {err("photo")}
            </div>

            <div>
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                I confirm the details above are true and I am filing this complaint myself.
              </label>
              {err("consent")}
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {busy ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
