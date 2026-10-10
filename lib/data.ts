import { supabase } from "@/lib/supabase";
import mock from "@/data/mockProjects.json";
import mockDepartmentRows from "@/data/mockDepartments.json";
import type {
  CitizenReport,
  ComplaintInput,
  ComplaintRecord,
  Department,
  Project,
  VerificationType,
} from "@/types";

/** Public Supabase Storage bucket used for uploaded photos. */
const PHOTO_BUCKET = "photos";

export type Source = "supabase" | "mock";
export interface Loaded<T> {
  data: T;
  source: Source;
  error?: string;
}

const mockDepartments = mockDepartmentRows as Department[];

/** Turns common Supabase errors into something a person can act on. */
export function explain(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid path"))
    return "The Supabase URL in .env.local looks wrong. It should be only https://<project-ref>.supabase.co with nothing after .co. Fix it and restart npm run dev.";
  if (m.includes("row-level security"))
    return "The database refused this save (row-level security). Add the insert policy for this table in Supabase.";
  if (m.includes("invalid api key") || m.includes("jwt"))
    return "The Supabase anon key in .env.local looks wrong. Copy it again from Project Settings → API.";
  if (m.includes("bucket not found"))
    return "The 'photos' storage bucket does not exist yet. Create a public bucket named photos in Supabase.";
  return message;
}

function mockProjects(): Project[] {
  const rows = mock.projects as unknown as Omit<
    Project,
    "department_id" | "verified_stalls"
  >[];
  return rows.map((p) => ({
    ...p,
    department_id: mockDepartments.find((d) => d.name === p.department)?.id ?? null,
    verified_stalls: 0,
  }));
}

function mockReports(): CitizenReport[] {
  return mock.reports as unknown as CitizenReport[];
}

/** Demo complaints so the map and log have something to show without a database. */
function mockComplaints(): ComplaintRecord[] {
  const d = (name: string) => mockDepartments.find((x) => x.name === name);
  const day = 86_400_000;
  const t = Date.now();
  const rows: Array<[number, string, string, string, string, number, number, string, number]> = [
    [1, "Road / Drainage", "GCC", "Gemini Flyover, Anna Salai", "Large pothole near the signal, two-wheelers swerving into traffic.", 13.0475, 80.2565, "Under Review", 0.3],
    [2, "Pipes", "CMWSSB", "Teynampet Main Road", "Pipeline leaking for three days and water is flooding the lane.", 13.0431, 80.2511, "Submitted", 1.2],
    [3, "Electricity", "TANGEDCO", "Mount Road", "Street light not working for a week, the stretch is very dark at night.", 13.0585, 80.2688, "In Progress", 2.5],
  ];
  const full: Record<string, string> = {
    GCC: "Greater Chennai Corporation (GCC)",
    CMWSSB: "CMWSSB (Chennai MetroWater)",
    TANGEDCO: "TANGEDCO",
  };
  return rows.map(([id, type, short, street, description, lat, lng, status, ago]) => ({
    id,
    complaint_type: type,
    department_id: d(full[short])?.id ?? 0,
    department: full[short],
    street,
    description,
    latitude: lat,
    longitude: lng,
    complaint_status: status,
    created_at: new Date(t - ago * day).toISOString(),
  }));
}

type ProjectRow = Omit<Project, "department" | "verified_stalls"> & {
  verified_stalls: number | null;
  department: { name: string } | null;
};

export async function fetchProjects(): Promise<Loaded<Project[]>> {
  if (!supabase) return { data: mockProjects(), source: "mock" };

  const { data, error } = await supabase
    .from("project")
    .select("*, department(name)");

  if (error) {
    return { data: mockProjects(), source: "mock", error: explain(error.message) };
  }

  const rows = (data ?? []) as unknown as ProjectRow[];
  return {
    source: "supabase",
    data: rows.map((r) => ({
      ...r,
      department: r.department?.name ?? "Unassigned",
      verified_stalls: r.verified_stalls ?? 0,
    })),
  };
}

export async function fetchReports(): Promise<Loaded<CitizenReport[]>> {
  if (!supabase) return { data: mockReports(), source: "mock" };

  const { data, error } = await supabase
    .from("citizen_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: mockReports(), source: "mock", error: explain(error.message) };
  }
  return { data: (data ?? []) as CitizenReport[], source: "supabase" };
}

export async function fetchDepartments(): Promise<Loaded<Department[]>> {
  if (!supabase) return { data: mockDepartments, source: "mock" };

  const { data, error } = await supabase
    .from("department")
    .select("id, name, contact_email, dept_category")
    .order("name");

  if (error) {
    return { data: mockDepartments, source: "mock", error: explain(error.message) };
  }
  return { data: (data ?? []) as Department[], source: "supabase" };
}

type ComplaintRow = Omit<ComplaintRecord, "department"> & {
  department: { name: string } | null;
};

/**
 * Complaints shown to everyone. The citizen's name and ID details are
 * deliberately NOT selected, so they never reach other users' browsers.
 */
export async function fetchComplaints(): Promise<Loaded<ComplaintRecord[]>> {
  if (!supabase) return { data: mockComplaints(), source: "mock" };

  const { data, error } = await supabase
    .from("citizen_complaints")
    .select(
      "id, complaint_type, department_id, street, description, latitude, longitude, complaint_status, created_at, department(name)"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { data: mockComplaints(), source: "mock", error: explain(error.message) };
  }

  const rows = (data ?? []) as unknown as ComplaintRow[];
  return {
    source: "supabase",
    data: rows.map((r) => ({ ...r, department: r.department?.name ?? "Unassigned" })),
  };
}

/** Uploads a photo to Storage and returns its public URL. Throws on failure. */
async function uploadPhoto(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error("Database is not connected.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Photo upload failed: ${explain(error.message)}`);

  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

type Result<T> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Saves a complaint. The ID number is never passed in here: only the ID *type*
 * is stored, and the status stays 'Pending' until real verification exists.
 * Returns a local copy of the complaint so the map and log can show it at once.
 */
export async function submitComplaint(
  input: ComplaintInput,
  departmentId: number,
  photo: File | null
): Promise<Result<{ saved: boolean; complaint: ComplaintRecord }>> {
  const local: ComplaintRecord = {
    id: Date.now(),
    complaint_type: input.category,
    department_id: departmentId,
    department: input.department,
    street: input.street,
    description: input.description,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    complaint_status: "Submitted",
    created_at: new Date().toISOString(),
  };

  // Demo mode: nothing to save, the email still opens.
  if (!supabase) return { ok: true, saved: false, complaint: local };

  try {
    const image_url = photo ? await uploadPhoto(photo, "complaints") : null;

    const { error } = await supabase.from("citizen_complaints").insert({
      citizen_name: input.citizen_name,
      verification_type: input.verification_type satisfies VerificationType,
      complaint_type: input.category,
      department_id: departmentId,
      street: input.street,
      description: input.description,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      image_url,
    });
    if (error) return { ok: false, error: explain(error.message) };
    return { ok: true, saved: true, complaint: local };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/** Saves a site photo report and returns the saved row. */
export async function submitReport(args: {
  project_id: number;
  ai_status_tag: string;
  notes: string;
  photo: File;
}): Promise<Result<{ report: CitizenReport; saved: boolean }>> {
  // Demo mode: build the row locally so the log still updates.
  if (!supabase) {
    return {
      ok: true,
      saved: false,
      report: {
        id: Date.now(),
        project_id: args.project_id,
        image_url: null,
        ai_status_tag: args.ai_status_tag,
        notes: args.notes,
        upvotes: 1,
        created_at: new Date().toISOString(),
      },
    };
  }

  try {
    const image_url = await uploadPhoto(args.photo, "reports");
    const { data, error } = await supabase
      .from("citizen_reports")
      .insert({
        project_id: args.project_id,
        image_url,
        ai_status_tag: args.ai_status_tag,
        notes: args.notes,
      })
      .select()
      .single();
    if (error) return { ok: false, error: explain(error.message) };
    return { ok: true, saved: true, report: data as CitizenReport };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}
