import type { CitizenReport, Department, Project } from "@/types";
import type { ComplaintCategory } from "@/types";

/** Whole days until the end date. Negative means overdue. `now` comes from useNow(). */
export function daysRemaining(
  endDate: string | null,
  now: number | null
): number | null {
  if (!endDate || now === null) return null;
  const end = new Date(`${endDate}T23:59:59`);
  return Math.ceil((end.getTime() - now) / 86_400_000);
}

export function countdownLabel(endDate: string | null, now: number | null): string {
  if (!endDate) return "No deadline set";
  const d = daysRemaining(endDate, now);
  if (d === null) return `Ends ${endDate}`; // before the browser time is known
  if (d < 0) return `${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`;
  if (d === 0) return "Due today";
  return `${d} day${d === 1 ? "" : "s"} remaining`;
}

/** Residents who reported a stalled site in the last 7 days. */
export function stalledReportsLast7Days(
  reports: CitizenReport[],
  now: number | null
): number {
  if (now === null) return 0;
  const cutoff = now - 7 * 86_400_000;
  return reports.filter(
    (r) =>
      r.ai_status_tag === "Stalled / Abandoned" &&
      new Date(r.created_at).getTime() >= cutoff
  ).length;
}

export function projectsWithNotices(projects: Project[]): Project[] {
  return projects.filter((p) => p.detour || p.status === "Delayed");
}

/** Straight-line distance in km between two coordinates. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLng = (bLng - aLng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Groups reports by project id. */
export function reportsByProject(
  reports: CitizenReport[] = []
): Map<number, CitizenReport[]> {
  const map = new Map<number, CitizenReport[]>();

  for (const r of reports ?? []) {
    if (r.project_id == null) continue;

    const list = map.get(r.project_id) ?? [];
    list.push(r);
    map.set(r.project_id, list);
  }

  return map;
}

export type ReportTone = "none" | "stalled" | "active" | "restored";

/**
 * Colour category for a project's report-count icon, taken from the most
 * recent report: stalled -> red, restored -> green, active work -> light grey.
 */
export function reportTone(reports: CitizenReport[]): ReportTone {
  if (reports.length === 0) return "none";
  const latest = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const tag = latest.ai_status_tag ?? "";
  if (tag.startsWith("Stalled")) return "stalled";
  if (tag.startsWith("Restored")) return "restored";
  return "active";
}

const knownCategories: ComplaintCategory[] = [
  "Road / Drainage",
  "Pipes",
  "Electricity",
  "Network Towers",
];

/** The complaint category a department handles, if it is one of the four known ones. */
export function categoryForDepartment(
  departments: Department[],
  departmentId: number | null | undefined
): ComplaintCategory | undefined {
  if (departmentId == null) return undefined;
  const c = departments.find((d) => d.id === departmentId)?.dept_category;
  return knownCategories.find((k) => k === c);
}

/** Narrows a free-text complaint type to one of the four known categories. */
export function asCategory(value: string | null | undefined): ComplaintCategory | undefined {
  return knownCategories.find((k) => k === value);
}
