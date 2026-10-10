/** "5 min ago", "2 hours ago", "Yesterday"... `now` comes from useNow(). */
export function timeAgo(iso: string, now: number | null): string {
  if (now === null) return "";
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}
