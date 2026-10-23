export type RequestedSlot = "morning" | "evening" | "full_day";
export type ReservedSlot = "morning" | "evening";
export type AvailabilityLabel = "AVAILABLE" | "PARTIAL" | "BOOKED";

export function slotsForRequest(slot: RequestedSlot): ReservedSlot[] {
  return slot === "full_day" ? ["morning", "evening"] : [slot];
}

export function availabilityForDate(reserved: ReservedSlot[], requested?: RequestedSlot) {
  const uniqueReserved = new Set(reserved);
  const label: AvailabilityLabel = uniqueReserved.size === 0 ? "AVAILABLE" : uniqueReserved.size === 1 ? "PARTIAL" : "BOOKED";
  const availableSlots = (["morning", "evening"] as const).filter((slot) => !uniqueReserved.has(slot));
  const requestedAvailable = requested ? slotsForRequest(requested).every((slot) => !uniqueReserved.has(slot)) : undefined;
  return { label, availableSlots, requestedAvailable };
}
