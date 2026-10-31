import { describe, expect, it } from "vitest";
import raw from "@/data/vendors.json";
import {
  type Vendor,
  type Weekday,
  filterVendors,
  isOpenAt,
  parseClock,
  sortVendors,
  validateVendorFile,
} from "./vendors";

const vendors = raw.vendors as unknown as Vendor[];

const at = (hour: number, minute = 0) => hour * 60 + minute;

describe("the shipped data", () => {
  it("passes its own validator", () => {
    // If this fails, `pnpm validate` will say exactly what is wrong.
    expect(validateVendorFile(raw)).toEqual([]);
  });

  it("gives every vendor all seven days of hours", () => {
    const days: Weekday[] = [
      "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
    ];
    for (const vendor of vendors) {
      for (const day of days) expect(vendor.hours).toHaveProperty(day);
    }
  });
});

describe("validateVendorFile", () => {
  it("rejects a file that is not an object", () => {
    expect(validateVendorFile(null)).toHaveLength(1);
    expect(validateVendorFile([])[0].field).toBe("vendors");
  });

  it("catches a duplicate id", () => {
    const entry = vendors[0];
    const errors = validateVendorFile({ vendors: [entry, entry] });
    expect(errors.some((e) => e.message === "duplicate id")).toBe(true);
  });

  it("refuses an assurance claim with no provenance", () => {
    // The rule the validator exists for: saying a place is certified without
    // saying who checked is the one error that could mislead someone about
    // what they are eating.
    const errors = validateVendorFile({
      vendors: [{ ...vendors[0], assurance: "certified", assuranceNote: "" }],
    });
    expect(errors.some((e) => e.field === "assuranceNote")).toBe(true);
  });

  it("allows an empty note when the entry claims nothing", () => {
    const errors = validateVendorFile({
      vendors: [{ ...vendors[0], assurance: "unverified", assuranceNote: "" }],
    });
    expect(errors.filter((e) => e.field === "assuranceNote")).toEqual([]);
  });

  it("catches a missing day rather than silently defaulting it", () => {
    const { monday, ...incomplete } = vendors[0].hours;
    void monday;
    const errors = validateVendorFile({
      vendors: [{ ...vendors[0], hours: incomplete }],
    });
    expect(errors.some((e) => e.message.includes("monday"))).toBe(true);
  });

  it("catches a malformed time", () => {
    const errors = validateVendorFile({
      vendors: [
        { ...vendors[0], hours: { ...vendors[0].hours, monday: { open: "8am", close: "21:00" } } },
      ],
    });
    expect(errors.some((e) => e.field === "hours.monday.open")).toBe(true);
  });

  it("reports every problem at once, not just the first", () => {
    const errors = validateVendorFile({ vendors: [{ id: "x" }] });
    expect(errors.length).toBeGreaterThan(3);
  });
});

describe("parseClock", () => {
  it("reads a padded 24-hour time", () => {
    expect(parseClock("08:30")).toBe(510);
    expect(parseClock("00:00")).toBe(0);
  });

  it("rejects anything else", () => {
    expect(parseClock("8:30")).toBeNull();
    expect(parseClock("24:00")).toBeNull();
    expect(parseClock("12:60")).toBeNull();
    expect(parseClock("evening")).toBeNull();
  });
});

describe("isOpenAt", () => {
  const vendor = (hours: Partial<Vendor["hours"]>): Vendor =>
    ({
      ...vendors[0],
      hours: {
        sunday: null, monday: null, tuesday: null, wednesday: null,
        thursday: null, friday: null, saturday: null,
        ...hours,
      },
    }) as Vendor;

  it("is open inside ordinary hours and closed outside them", () => {
    const v = vendor({ monday: { open: "08:00", close: "19:00" } });
    expect(isOpenAt(v, "monday", at(12))).toBe(true);
    expect(isOpenAt(v, "monday", at(7, 59))).toBe(false);
    expect(isOpenAt(v, "monday", at(19))).toBe(false);
  });

  it("is closed on a day marked null", () => {
    const v = vendor({ monday: { open: "08:00", close: "19:00" } });
    expect(isOpenAt(v, "sunday", at(12))).toBe(false);
  });

  it("stays open in the evening when closing time is after midnight", () => {
    // The bug every opening-hours implementation has: 18:00-02:00 has a
    // closing time numerically smaller than its opening time, and the naive
    // comparison calls it closed all evening.
    const v = vendor({ friday: { open: "18:00", close: "02:00" } });
    expect(isOpenAt(v, "friday", at(20))).toBe(true);
    expect(isOpenAt(v, "friday", at(23, 59))).toBe(true);
  });

  it("is still open after midnight on the following day", () => {
    const v = vendor({ friday: { open: "18:00", close: "02:00" } });
    expect(isOpenAt(v, "saturday", at(0, 30))).toBe(true);
    expect(isOpenAt(v, "saturday", at(2, 30))).toBe(false);
  });

  it("does not carry over from a day that closed normally", () => {
    const v = vendor({ friday: { open: "08:00", close: "19:00" } });
    expect(isOpenAt(v, "saturday", at(0, 30))).toBe(false);
  });

  it("wraps from Saturday back to Sunday", () => {
    const v = vendor({ saturday: { open: "20:00", close: "03:00" } });
    expect(isOpenAt(v, "sunday", at(1))).toBe(true);
  });
});

describe("filterVendors", () => {
  it("returns everything when nothing is filtered", () => {
    expect(filterVendors(vendors, {})).toHaveLength(vendors.length);
  });

  it("filters by area", () => {
    const result = filterVendors(vendors, { area: "Yaba" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((v) => v.area === "Yaba")).toBe(true);
  });

  it("treats maxPrice as a ceiling, not an exact match", () => {
    const result = filterVendors(vendors, { maxPrice: "₦₦" });
    expect(result.every((v) => v.priceBand !== "₦₦₦")).toBe(true);
    expect(result.some((v) => v.priceBand === "₦")).toBe(true);
  });

  it("treats minAssurance as a floor", () => {
    const result = filterVendors(vendors, { minAssurance: "muslim-owned" });
    expect(result.every((v) => ["muslim-owned", "certified"].includes(v.assurance))).toBe(true);
  });

  it("searches dish names, not just vendor names", () => {
    // Students search for "suya", not for a place they have never heard of.
    const result = filterVendors(vendors, { query: "suya" });
    expect(result.length).toBeGreaterThan(0);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(filterVendors(vendors, { query: "  SUYA " }).length).toBeGreaterThan(0);
  });
});

describe("sortVendors", () => {
  it("puts the best-assured first", () => {
    const sorted = sortVendors(vendors);
    expect(sorted[0].assurance).toBe("certified");
  });

  it("does not mutate the input", () => {
    const before = vendors.map((v) => v.id);
    sortVendors(vendors);
    expect(vendors.map((v) => v.id)).toEqual(before);
  });
});
