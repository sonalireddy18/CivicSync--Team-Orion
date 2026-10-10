import type { ComplaintInput } from "@/types";

function build(complaint: ComplaintInput) {
  const subject = `[CivicSync] ${complaint.category} complaint - ${complaint.street}`;
  const lines = [
    `Department: ${complaint.department}`,
    `Category: ${complaint.category}`,
    `Location: ${complaint.street}`,
  ];
  if (complaint.latitude != null && complaint.longitude != null) {
    lines.push(
      `Map: https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=18/${complaint.latitude}/${complaint.longitude}`
    );
  }
  lines.push(
    "",
    "Description:",
    complaint.description,
    "",
    `Submitted by: ${complaint.citizen_name}`,
    `ID verification type: ${complaint.verification_type}`,
    "",
    "Sent via CivicSync"
  );
  return { subject, body: lines.join("\n") };
}

/**
 * Link that opens a compose window in Gmail (in the browser), prefilled.
 * NOTE: Identity document numbers are intentionally never included.
 */
export function buildComplaintGmailUrl(
  toEmail: string,
  complaint: ComplaintInput
): string {
  const { subject, body } = build(complaint);
  return (
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(toEmail)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

/** Kept for anything that still wants the default mail app. Not used by the complaint form. */
export function buildComplaintMailto(
  toEmail: string,
  complaint: ComplaintInput
): string {
  const { subject, body } = build(complaint);
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
