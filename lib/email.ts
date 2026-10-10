import type { ComplaintInput } from "@/types";

/**
 * Builds a prefilled mailto: link for a complaint.
 * NOTE: Identity document numbers are intentionally never included.
 */
export function buildComplaintMailto(
  toEmail: string,
  complaint: ComplaintInput
): string {
  const subject = `[CivicSync] ${complaint.category} complaint - ${complaint.street}`;
  const body = [
    `Department: ${complaint.department}`,
    `Category: ${complaint.category}`,
    `Location: ${complaint.street}`,
    "",
    "Description:",
    complaint.description,
    "",
    `Submitted by: ${complaint.citizen_name}`,
    `ID verification type: ${complaint.verification_type}`,
    "",
    "Sent via CivicSync",
  ].join("\n");

  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}
