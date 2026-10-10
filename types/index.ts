export type ProjectStatus = "Planned" | "In Progress" | "Delayed";

export interface Project {
  id: number;
  title: string;
  department: string;
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
}

export interface CitizenReport {
  id: number;
  project_id: number;
  image_url: string | null;
  ai_status_tag: string | null;
  notes: string | null;
  upvotes: number;
  created_at: string;
  // Placeholder until a conversations table exists. null = no conversation yet.
  conversation_id: number | null;
}

export interface Department {
  id: number;
  name: string;
  contact_email: string;
}

export type VerificationType = "Aadhaar" | "PAN Card" | "Drivers License";

export type ComplaintCategory =
  | "Road / Pothole"
  | "Water / Pipeline"
  | "Electricity"
  | "Drainage"
  | "Blocked Road"
  | "Other";

export interface ComplaintInput {
  citizen_name: string;
  verification_type: VerificationType;
  category: ComplaintCategory;
  street: string;
  description: string;
  department: string;
}
