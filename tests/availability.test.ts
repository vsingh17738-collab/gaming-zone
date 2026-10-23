import { describe, expect, it } from "vitest";
import { availabilityForDate, slotsForRequest } from "@/lib/availability";

 describe("availability and slot overlap semantics", () => {
  it("labels open, half-reserved and fully reserved dates", () => {
    expect(availabilityForDate([]).label).toBe("AVAILABLE");
    expect(availabilityForDate(["morning"]).label).toBe("PARTIAL");
    expect(availabilityForDate(["morning", "evening"]).label).toBe("BOOKED");
  });
  it("expands full-day requests to both unique reservation rows", () => {
    expect(slotsForRequest("full_day")).toEqual(["morning", "evening"]);
    expect(slotsForRequest("morning")).toEqual(["morning"]);
  });
  it("prevents morning/full-day and evening/full-day overlap", () => {
    expect(availabilityForDate(["morning"], "full_day").requestedAvailable).toBe(false);
    expect(availabilityForDate(["evening"], "full_day").requestedAvailable).toBe(false);
    expect(availabilityForDate(["morning"], "morning").requestedAvailable).toBe(false);
    expect(availabilityForDate(["morning"], "evening").requestedAvailable).toBe(true);
  });
  it("does not expose customer fields in public availability results", () => {
    const result = availabilityForDate(["morning"], "evening");
    expect(Object.keys(result).sort()).toEqual(["availableSlots", "label", "requestedAvailable"]);
  });
});
