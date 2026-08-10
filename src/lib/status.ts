export function statusPillClass(status: string): string {
  const value = status.toUpperCase();
  if (["PAID", "APPROVED", "ACTIVE", "PUBLISHED", "ISSUED", "CHECKED_IN"].includes(value)) {
    return "status-pill";
  }
  if (["PENDING", "CREATED", "DRAFT", "RESERVED"].includes(value)) {
    return "status-pill warn";
  }
  if (["CANCELLED", "FAILED", "EXPIRED", "REJECTED"].includes(value)) {
    return "status-pill danger";
  }
  return "status-pill neutral";
}
