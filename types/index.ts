export type ProjectStatus = "Planned" | "In Progress" | "Delayed";

export interface Project {
  id: number;
  title: string;
  department_id: number | null;
  department: string; // department name, joined from the department table
  street: string;
  status: ProjectStatus;
  status_color: string;
  budget: string | null;
  contractor: string | null;
  start_date: string | null;
  end_date: string | null;
  delay_reason: string | null;
  detour: string | null;
  latitude: number;
  longitude: number;
  verified_stalls: number;
}

export interface CitizenReport {
  id: number;
  project_id: number | null;
  image_url: string | null;
  ai_status_tag: string;
  notes: string | null;
  upvotes: number | null;
  created_at: string;
  // No conversations table yet, so this is normally undefined.
  conversation_id?: number | null;
}

export interface Department {
  id: number;
  name: string;
  contact_email: string;
  dept_category: string;
}

export type VerificationType = "Aadhaar" | "PAN Card" | "Drivers License";

// Must match the citizen_complaints_category_check constraint
export type ComplaintCategory =
  | "Road / Drainage"
  | "Pipes"
  | "Electricity"
  | "Network Towers";

export interface ComplaintInput {
  citizen_name: string;
  verification_type: VerificationType;
  category: ComplaintCategory;
  street: string;
  description: string;
  department: string; // department name, used in the email
  latitude?: number | null;
  longitude?: number | null;
}

/** A complaint as shown to other citizens. Never includes name or ID details. */
export interface ComplaintRecord {
  id: number;
  complaint_type: string;
  department_id: number;
  department: string;
  street: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  complaint_status: string;
  created_at: string;
}

/** Details carried from a map dot (or a map click) into the report / verification popups. */
export interface ReportPrefill {
  category?: ComplaintCategory;
  departmentId?: number | null;
  department?: string;
  street?: string;
  latitude?: number | null;
  longitude?: number | null;
  projectId?: number | null;
}
