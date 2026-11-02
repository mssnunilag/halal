/**
 * The vendor directory, and the rules that keep it honest.
 *
 * This project's whole value is the data, which means almost every pull
 * request will be somebody adding or correcting a vendor rather than writing
 * code. Two things follow from that, and they shape this file:
 *
 * 1. The schema is validated at runtime by a script (`pnpm validate`), not
 *    just typed. TypeScript cannot check a JSON file somebody hand-edited in
 *    a browser tab, and a malformed entry that only fails at render time is
 *    a bad first experience for a new contributor.
 *
 * 2. We never simply assert that food is halal. We record *how we know*, and
 *    show that to the student, because the honest answer is usually "a
 *    Muslim student told us they eat there" and presenting that as
 *    certification would be a genuine wrong.
 */

export const AREAS = ["Akoka", "Yaba", "Bariga", "On campus"] as const;
export type Area = (typeof AREAS)[number];

/**
 * How we know this is halal, worst to best. This is the field that matters
 * most and the one most likely to be filled in carelessly, so the labels are
 * deliberately plain about their own weakness.
 */
export const ASSURANCE_LEVELS = [
  "unverified",
  "community-reported",
  "muslim-owned",
  "certified",
] as const;
export type Assurance = (typeof ASSURANCE_LEVELS)[number];

export const ASSURANCE_LABEL: Record<Assurance, string> = {
  unverified: "Not checked — nobody has confirmed this",
  "community-reported": "A student reported eating here",
  "muslim-owned": "Muslim-owned, confirmed in person",
  certified: "Holds halal certification",
};

/** Rough cost of one normal meal, in naira. Stored as a band rather than a
 *  number because prices in Lagos move faster than anybody will update a
 *  JSON file, and a stale exact price is worse than an honest range. */
export const PRICE_BANDS = ["₦", "₦₦", "₦₦₦"] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** `null` means closed that day. Times are "HH:MM" on a 24-hour clock. */
export type DayHours = { readonly open: string; readonly close: string } | null;

export interface Vendor {
  readonly id: string;
  readonly name: string;
  readonly area: Area;
  readonly description: string;
  readonly landmark: string;
  readonly priceBand: PriceBand;
  readonly assurance: Assurance;
  /** Free text saying who checked and when. Required for anything above
   *  "unverified" — an assurance with no provenance is just an assertion. */
  readonly assuranceNote: string;
  readonly hours: Readonly<Record<Weekday, DayHours>>;
  readonly dishes: readonly string[];
}

/** Minutes since midnight from "HH:MM", or null if it is not a time. */
export function parseClock(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Whether the vendor is open at a given moment.
 *
 * Handles the case that bites every opening-hours implementation: a place
 * that closes after midnight. "18:00–02:00" is a closing time numerically
 * smaller than its opening time, and the naive `open <= now && now < close`
 * reports such a vendor as closed all evening — exactly when students are
 * looking for food.
 */
export function isOpenAt(
  vendor: Vendor,
  day: Weekday,
  minutesSinceMidnight: number
): boolean {
  const today = vendor.hours[day];
  if (today) {
    const open = parseClock(today.open);
    const close = parseClock(today.close);
    if (open !== null && close !== null) {
      if (close > open) {
        if (minutesSinceMidnight >= open && minutesSinceMidnight < close) return true;
      } else if (minutesSinceMidnight >= open) {
        // Opens today, closes after midnight — still open tonight.
        return true;
      }
    }
  }

  // Carry over from yesterday's late session: a place open 18:00–02:00 on
  // Friday is still open at 00:30 on Saturday.
  const yesterdayIndex = (WEEKDAYS.indexOf(day) + 6) % 7;
  const yesterday = vendor.hours[WEEKDAYS[yesterdayIndex]];
  if (!yesterday) return false;

  const open = parseClock(yesterday.open);
  const close = parseClock(yesterday.close);
  if (open === null || close === null || close > open) return false;
  return minutesSinceMidnight < close;
}

export interface Filters {
  readonly area?: Area | "all";
  readonly maxPrice?: PriceBand;
  readonly minAssurance?: Assurance;
  readonly query?: string;
}

export function filterVendors(
  vendors: readonly Vendor[],
  filters: Filters
): Vendor[] {
  const query = filters.query?.trim().toLowerCase() ?? "";

  return vendors.filter((vendor) => {
    if (filters.area && filters.area !== "all" && vendor.area !== filters.area)
      return false;

    if (
      filters.maxPrice &&
      PRICE_BANDS.indexOf(vendor.priceBand) > PRICE_BANDS.indexOf(filters.maxPrice)
    )
      return false;

    if (
      filters.minAssurance &&
      ASSURANCE_LEVELS.indexOf(vendor.assurance) <
        ASSURANCE_LEVELS.indexOf(filters.minAssurance)
    )
      return false;

    if (query) {
      // Dishes are searched too: students look for "suya" or "amala", not for
      // the name of a place they have never heard of.
      const haystack = [vendor.name, vendor.description, vendor.landmark, ...vendor.dishes]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

/** Best-assured first, then cheapest. Someone scanning this list cares more
 *  about whether they can trust it than about anything else on the card. */
export function sortVendors(vendors: readonly Vendor[]): Vendor[] {
  return [...vendors].sort(
    (a, b) =>
      ASSURANCE_LEVELS.indexOf(b.assurance) - ASSURANCE_LEVELS.indexOf(a.assurance) ||
      PRICE_BANDS.indexOf(a.priceBand) - PRICE_BANDS.indexOf(b.priceBand) ||
      a.name.localeCompare(b.name)
  );
}

const ISSUES_NEW_URL = "https://github.com/mssnunilag/halal/issues/new";

/** A link, not a form: GitHub fills the issue in from the query string, so the
 *  site stores and sends nothing. The vendor id goes in the body because it is
 *  the one thing a maintainer needs to find the entry in data/vendors.json. */
export function reportProblemUrl(vendor: Pick<Vendor, "id" | "name">): string {
  const params = new URLSearchParams({
    title: `Problem with ${vendor.name} (${vendor.id})`,
    body: `Vendor id: ${vendor.id}\n\nWhat is wrong:\n`,
  });
  return `${ISSUES_NEW_URL}?${params}`;
}

export interface ValidationError {
  readonly vendorId: string;
  readonly field: string;
  readonly message: string;
}

/**
 * Check one entry from the JSON file. Returns every problem rather than the
 * first, so a contributor fixing a new vendor sees the whole list at once
 * instead of running the script five times.
 */
export function validateVendor(value: unknown, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const at = (field: string, message: string, id = `#${index}`) =>
    errors.push({ vendorId: id, field, message });

  if (typeof value !== "object" || value === null) {
    at("", "entry is not an object");
    return errors;
  }

  const v = value as Record<string, unknown>;
  const id = typeof v.id === "string" ? v.id : `#${index}`;

  for (const field of ["id", "name", "description", "landmark"]) {
    if (typeof v[field] !== "string" || (v[field] as string).trim() === "") {
      at(field, "must be a non-empty string", id);
    }
  }

  // assuranceNote is checked separately rather than here: an entry claiming
  // nothing is allowed to say nothing, and only a claim above "unverified"
  // has to carry its provenance.
  if (typeof v.assuranceNote !== "string") {
    at("assuranceNote", 'must be a string (use "" if there is nothing to say)', id);
  }

  if (!AREAS.includes(v.area as Area)) {
    at("area", `must be one of: ${AREAS.join(", ")}`, id);
  }

  if (!PRICE_BANDS.includes(v.priceBand as PriceBand)) {
    at("priceBand", `must be one of: ${PRICE_BANDS.join(", ")}`, id);
  }

  if (!ASSURANCE_LEVELS.includes(v.assurance as Assurance)) {
    at("assurance", `must be one of: ${ASSURANCE_LEVELS.join(", ")}`, id);
  } else if (
    v.assurance !== "unverified" &&
    (typeof v.assuranceNote !== "string" || v.assuranceNote.trim().length < 10)
  ) {
    // The rule this whole file exists for. Claiming a place is Muslim-owned
    // or certified without saying who checked is the one failure that could
    // actually mislead somebody about what they are eating.
    at(
      "assuranceNote",
      "anything above 'unverified' must say who checked and when (at least 10 characters)",
      id
    );
  }

  if (!Array.isArray(v.dishes) || v.dishes.length === 0) {
    at("dishes", "list at least one dish", id);
  }

  if (typeof v.hours !== "object" || v.hours === null) {
    at("hours", "must be an object with all seven days", id);
  } else {
    const hours = v.hours as Record<string, unknown>;
    for (const day of WEEKDAYS) {
      if (!(day in hours)) {
        at("hours", `missing "${day}" (use null if closed)`, id);
        continue;
      }
      const entry = hours[day];
      if (entry === null) continue;
      if (typeof entry !== "object") {
        at(`hours.${day}`, "must be null or { open, close }", id);
        continue;
      }
      const { open, close } = entry as Record<string, unknown>;
      if (typeof open !== "string" || parseClock(open) === null) {
        at(`hours.${day}.open`, 'must look like "08:00"', id);
      }
      if (typeof close !== "string" || parseClock(close) === null) {
        at(`hours.${day}.close`, 'must look like "21:30"', id);
      }
    }
  }

  return errors;
}

/** Validate the whole file, including cross-entry rules. */
export function validateVendorFile(value: unknown): ValidationError[] {
  if (typeof value !== "object" || value === null) {
    return [{ vendorId: "", field: "", message: "file is not an object" }];
  }

  const vendors = (value as Record<string, unknown>).vendors;
  if (!Array.isArray(vendors)) {
    return [{ vendorId: "", field: "vendors", message: "must be an array" }];
  }

  const errors = vendors.flatMap((vendor, index) => validateVendor(vendor, index));

  const seen = new Set<string>();
  for (const vendor of vendors) {
    const id = (vendor as { id?: unknown })?.id;
    if (typeof id !== "string") continue;
    if (seen.has(id)) {
      errors.push({ vendorId: id, field: "id", message: "duplicate id" });
    }
    seen.add(id);
  }

  return errors;
}
