import type { CitizenReport, Project } from "@/types";

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
