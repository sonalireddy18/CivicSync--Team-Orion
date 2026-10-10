"use client";

import { useState } from "react";
import departments from "@/data/mockDepartments.json";
import { buildComplaintMailto } from "@/lib/email";
import type {
  ComplaintCategory,
  ComplaintInput,
  VerificationType,
} from "@/types";

const categories: ComplaintCategory[] = [
  "Road / Pothole",
  "Water / Pipeline",
  "Electricity",
  "Drainage",
  "Blocked Road",
  "Other",
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

// Category picks the most likely department automatically (user can still change it)
const categoryDepartment: Record<ComplaintCategory, string | null> = {
  "Road / Pothole": "Public Works Department",
  "Water / Pipeline": "Water Supply & Drainage Board",
  Electricity: "Electricity Board",
  Drainage: "Municipal Drainage Board",
  "Blocked Road": "Public Works Department",
  Other: null,
};

type Errors = Partial<Record<string, string>>;

const MAX_BYTES = 5 * 1024 * 1024;

export default function ComplaintModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [vType, setVType] = useState<VerificationType>("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("Road / Pothole");
  const [department, setDepartment] = useState(departments[0].name);
  const [street, setStreet] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const rule = idRules[vType];

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

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload: ComplaintInput = {
      citizen_name: name.trim(),
      verification_type: vType,
      category,
      street: street.trim(),
      description: description.trim(),
      department,
    };
    // The ID number is only checked for format here. It is never stored or emailed.
    // TODO: insert payload into citizen_complaints (verification_status 'Pending')
    const dept = departments.find((x) => x.name === department)!;
    window.location.href = buildComplaintMailto(dept.contact_email, payload);
    setSent(true);
  }

  function close() {
    setSent(false);
    setErrors({});
    setIdNumber("");
    setConsent(false);
    onClose();
  }

  const input = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm";
  const label = "block text-sm font-semibold text-slate-600";
  const err = (k: string) =>
    errors[k] ? <p className="mt-1 text-xs font-medium text-red-600">{errors[k]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-8 w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">File a Complaint</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sent directly to the responsible department.
            </p>
          </div>
          <button onClick={close} aria-label="Close" className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        {sent ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900">
            Your email app should have opened with the complaint prefilled. Press send there to
            submit it to the department.
            <button onClick={close} className="mt-4 block rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
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
                    const c = e.target.value as ComplaintCategory;
                    setCategory(c);
                    const d = categoryDepartment[c];
                    if (d) setDepartment(d);
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
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className={input}>
                  {departments.map((d) => (
                    <option key={d.id}>{d.name}</option>
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

            <button type="submit" className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-800">
              Submit Complaint
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
